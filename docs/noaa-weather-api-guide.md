# NOAA Weather API Integration Guide

## Overview
This guide documents the NOAA Weather API endpoints and implementation strategies for WeatherProof. All endpoints have been tested with the test project location (NYC: 40.7128, -74.0060).

## API Endpoints

### 1. Points API - Get Grid Coordinates
**Endpoint:** `GET https://api.weather.gov/points/{latitude},{longitude}`

**Purpose:** Convert lat/long to NOAA grid coordinates (required for forecasts)

**Example:**
```bash
curl -H "User-Agent: WeatherProof (contact@weatherproof.com)" \
  "https://api.weather.gov/points/40.7128,-74.0060"
```

**Response:**
```json
{
  "properties": {
    "gridId": "OKX",
    "gridX": 33,
    "gridY": 35,
    "forecast": "https://api.weather.gov/gridpoints/OKX/33,35/forecast",
    "forecastHourly": "https://api.weather.gov/gridpoints/OKX/33,35/forecast/hourly"
  }
}
```

### 2. Hourly Forecast
**Endpoint:** `GET https://api.weather.gov/gridpoints/{office}/{gridX},{gridY}/forecast/hourly`

**Purpose:** Get detailed hourly weather forecast for next 7 days

**Example:**
```bash
curl -H "User-Agent: WeatherProof (contact@weatherproof.com)" \
  "https://api.weather.gov/gridpoints/OKX/33,35/forecast/hourly"
```

**Response Fields:**
- `temperature`: Temperature in Fahrenheit
- `windSpeed`: Wind speed (e.g., "10 mph")
- `windDirection`: Wind direction (e.g., "NE")
- `probabilityOfPrecipitation`: Percentage (0-100)
- `shortForecast`: Brief description (e.g., "Mostly Cloudy")
- `relativeHumidity`: Percentage

### 3. Current/Historical Observations
**Endpoint:** `GET https://api.weather.gov/stations/{stationId}/observations`

**Purpose:** Get actual recorded weather data (not forecasts)

**Parameters:**
- `start`: ISO 8601 timestamp (e.g., `2025-07-30T00:00:00Z`)
- `end`: ISO 8601 timestamp

**Finding Stations:**
```bash
# Get nearby stations
curl -H "User-Agent: WeatherProof (contact@weatherproof.com)" \
  "https://api.weather.gov/points/40.7128,-74.0060/stations"
```

**Reliable NYC Stations:**
- `KJFK` - JFK Airport
- `KLGA` - LaGuardia Airport
- `KEWR` - Newark Airport
- `KNYC` - Central Park (less frequent updates)

**Example:**
```bash
# Latest observation
curl -H "User-Agent: WeatherProof (contact@weatherproof.com)" \
  "https://api.weather.gov/stations/KJFK/observations/latest"

# Historical range
curl -H "User-Agent: WeatherProof (contact@weatherproof.com)" \
  "https://api.weather.gov/stations/KJFK/observations?start=2025-07-30T00:00:00Z&end=2025-07-31T00:00:00Z"
```

### 4. Weather Alerts
**Endpoint:** `GET https://api.weather.gov/alerts/active`

**Purpose:** Get active weather warnings, watches, and advisories

**Query Parameters:**
- `point={lat},{lon}` - Alerts for specific coordinates
- `area={state}` - Alerts for entire state (e.g., "NY")
- `severity=Extreme,Severe` - Filter by severity
- `urgency=Immediate,Expected` - Filter by urgency

**Example:**
```bash
# Alerts for location
curl -H "User-Agent: WeatherProof (contact@weatherproof.com)" \
  "https://api.weather.gov/alerts/active?point=40.7128,-74.0060"

# Construction-relevant alerts only
curl -H "User-Agent: WeatherProof (contact@weatherproof.com)" \
  "https://api.weather.gov/alerts/active?point=40.7128,-74.0060&severity=Extreme,Severe&urgency=Immediate,Expected"
```

**Alert Fields:**
- `event`: Type of alert (e.g., "Flood Watch", "High Wind Warning")
- `severity`: Extreme, Severe, Moderate, Minor
- `urgency`: Immediate, Expected, Future, Past
- `headline`: Human-readable summary
- `description`: Detailed information

## Implementation Strategy

### 1. Address to Weather Flow
```javascript
// Step 1: Geocode address to coordinates
const coords = await geocodeAddress("123 Test St, NYC, NY")
// Returns: { latitude: 40.7128, longitude: -74.0060 }

// Step 2: Get NOAA grid (cache this!)
const grid = await fetch(`/points/${coords.latitude},${coords.longitude}`)
// Returns: { gridId: "OKX", gridX: 33, gridY: 35 }

// Step 3: Get weather data
const forecast = await fetch(`/gridpoints/${grid.gridId}/${grid.gridX},${grid.gridY}/forecast/hourly`)
const alerts = await fetch(`/alerts/active?point=${coords.latitude},${coords.longitude}`)
```

### 2. N8N Webhook Parameters
```typescript
interface WeatherRequest {
  // Required
  latitude: number
  longitude: number
  date: string // YYYY-MM-DD
  
  // Optional
  startTime?: string // HH:MM
  endTime?: string // HH:MM
  gridId?: string // Cached from previous lookup
  gridX?: number
  gridY?: number
}

interface WeatherResponse {
  temperature: number
  temperatureUnit: string
  windSpeed: number
  windDirection: string
  precipitation: number
  precipitationType?: string
  conditions: string[]
  humidity?: number
  alerts?: Array<{
    event: string
    severity: string
    urgency: string
    description: string
  }>
}
```

### 3. Caching Strategy
```sql
-- Add to projects table
ALTER TABLE projects ADD COLUMN 
  cached_grid_id VARCHAR(10),
  cached_grid_x INTEGER,
  cached_grid_y INTEGER,
  nearest_station VARCHAR(10),
  geocode_updated_at TIMESTAMPTZ;
```

### 4. Weather Storage Schema
```sql
CREATE TABLE weather_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  recorded_at TIMESTAMPTZ NOT NULL,
  
  -- Core weather data
  temperature NUMERIC(5,2),
  wind_speed NUMERIC(5,2),
  wind_direction VARCHAR(10),
  precipitation NUMERIC(5,2),
  conditions TEXT[],
  
  -- Alert tracking
  has_alerts BOOLEAN DEFAULT false,
  alert_types TEXT[],
  
  -- Raw data for reference
  raw_forecast JSONB,
  raw_alerts JSONB,
  
  -- Metadata
  source VARCHAR(50), -- 'forecast' or 'observation'
  station_id VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_weather_project_time ON weather_history(project_id, recorded_at DESC);
CREATE INDEX idx_weather_alerts ON weather_history(project_id, has_alerts) WHERE has_alerts = true;
```

## Best Practices

1. **Always include User-Agent header** with contact email
2. **Cache grid coordinates** - they rarely change
3. **Use appropriate stations** for historical data (airports are most reliable)
4. **Handle rate limits** - wait 5 seconds between retries
5. **Store weather proactively** - don't wait for user to document delays

## Construction-Relevant Thresholds

When auto-populating delay conditions based on NOAA data:

- **Rain**: precipitation > 0.1" per hour
- **Heavy Rain**: precipitation > 0.5" per hour
- **High Winds**: windSpeed > 25 mph
- **Wind**: windSpeed > 15 mph
- **Cold**: temperature < 40°F
- **Extreme Heat**: temperature > 95°F
- **Lightning**: Check alerts for "Thunderstorm" warnings

## Common Alert Types for Construction

- Flood Watch/Warning
- High Wind Warning
- Severe Thunderstorm Warning
- Winter Storm Warning/Watch
- Excessive Heat Warning
- Dense Fog Advisory
- Lightning/Thunder alerts

## Testing Commands

```bash
# Test complete flow for a project
PROJECT_LAT=40.7128
PROJECT_LON=-74.0060

# 1. Get grid
curl -H "User-Agent: WeatherProof Test" \
  "https://api.weather.gov/points/$PROJECT_LAT,$PROJECT_LON"

# 2. Get forecast (use grid values from step 1)
curl -H "User-Agent: WeatherProof Test" \
  "https://api.weather.gov/gridpoints/OKX/33,35/forecast/hourly"

# 3. Get current alerts
curl -H "User-Agent: WeatherProof Test" \
  "https://api.weather.gov/alerts/active?point=$PROJECT_LAT,$PROJECT_LON"

# 4. Get latest observation
curl -H "User-Agent: WeatherProof Test" \
  "https://api.weather.gov/stations/KJFK/observations/latest"
```

## Notes

- NOAA API is free but requires proper User-Agent
- Forecast data updates hourly
- Historical data limited to 7 days via API
- For long-term historical data, consider storing observations as they occur
- Alert history not available via API - must be captured when active