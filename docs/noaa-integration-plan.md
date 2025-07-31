# NOAA Weather Data Integration Plan

## Overview
This document outlines the implementation plan for integrating NOAA (National Oceanic and Atmospheric Administration) weather data into WeatherProof for insurance claim verification.

## Why NOAA?
- **Gold Standard**: Insurance companies trust NOAA data above all other sources
- **Free API**: No cost for basic access
- **Historical Data**: Access to past weather for claim verification
- **Legal Standing**: Court-admissible weather documentation

## NOAA API Options

### 1. NOAA Climate Data Online API
- **Best for**: Historical weather data
- **Endpoint**: `https://www.ncdc.noaa.gov/cdo-web/api/v2/`
- **Key Required**: Yes (free registration)
- **Rate Limit**: 1,000 requests per day

### 2. NOAA Weather API (api.weather.gov)
- **Best for**: Current conditions and forecasts
- **Endpoint**: `https://api.weather.gov/`
- **Key Required**: No
- **Rate Limit**: Reasonable use

### 3. NOAA NDFD (National Digital Forecast Database)
- **Best for**: Detailed forecasts
- **Format**: XML/SOAP
- **More complex but comprehensive

## Implementation Strategy

### Phase 1: Basic Integration

```typescript
// services/noaa-weather.ts
export class NOAAWeatherService {
  private baseUrl = 'https://api.weather.gov';
  
  async getCurrentWeather(lat: number, lng: number) {
    // 1. Get grid point for location
    const pointResponse = await fetch(
      `${this.baseUrl}/points/${lat},${lng}`
    );
    const pointData = await pointResponse.json();
    
    // 2. Get current observations from nearest station
    const stationId = pointData.properties.observationStations[0];
    const obsResponse = await fetch(
      `${stationId}/observations/latest`
    );
    
    return this.formatWeatherData(await obsResponse.json());
  }
  
  async getHistoricalWeather(lat: number, lng: number, date: Date) {
    // Use Climate Data Online API
    const token = process.env.NOAA_CDO_TOKEN;
    const dateStr = format(date, 'yyyy-MM-dd');
    
    const response = await fetch(
      `https://www.ncdc.noaa.gov/cdo-web/api/v2/data?` +
      `datasetid=GHCND&` +
      `startdate=${dateStr}&` +
      `enddate=${dateStr}&` +
      `latitude=${lat}&` +
      `longitude=${lng}&` +
      `limit=1000`,
      {
        headers: { token }
      }
    );
    
    return this.parseHistoricalData(await response.json());
  }
}
```

### Phase 2: Smart Weather Fetching

```typescript
// When documenting a delay
export async function documentWeatherDelay(projectId: string, delayInfo: any) {
  const project = await getProject(projectId);
  
  // Fetch weather from multiple sources for verification
  const [noaaData, stationDistance] = await Promise.all([
    noaaService.getCurrentWeather(project.lat, project.lng),
    noaaService.getNearestStationDistance(project.lat, project.lng)
  ]);
  
  // Auto-populate delay form
  return {
    weather: {
      source: 'NOAA',
      station_id: noaaData.station.id,
      station_name: noaaData.station.name,
      station_distance_miles: stationDistance,
      
      // Actual conditions
      temperature: noaaData.temperature.value,
      wind_speed: noaaData.windSpeed.value,
      wind_gust: noaaData.windGust.value,
      precipitation: noaaData.precipitationLastHour.value,
      visibility: noaaData.visibility.value,
      conditions: noaaData.textDescription,
      
      // Insurance-required fields
      observation_time: noaaData.timestamp,
      raw_metar: noaaData.rawMessage,
      
      // Direct link for verification
      noaa_url: noaaData.properties['@id']
    },
    
    // Check thresholds
    violations: checkWeatherThresholds(noaaData, project.weather_thresholds),
    
    // Suggest delay type
    suggested_delay_type: determineDelayType(noaaData)
  };
}
```

### Phase 3: Historical Comparison

```typescript
// For insurance claims - prove weather was abnormal
export async function generateAbnormalWeatherReport(
  location: { lat: number, lng: number },
  eventDate: Date
) {
  // Get 10-year historical average for this date
  const historicalData = await Promise.all(
    Array.from({ length: 10 }, (_, i) => {
      const historicalDate = subYears(eventDate, i + 1);
      return noaaService.getHistoricalWeather(
        location.lat,
        location.lng,
        historicalDate
      );
    })
  );
  
  // Calculate averages
  const historicalAvg = {
    precipitation: average(historicalData.map(d => d.precipitation)),
    windSpeed: average(historicalData.map(d => d.windSpeed)),
    temperature: average(historicalData.map(d => d.temperature))
  };
  
  // Get actual conditions
  const actualConditions = await noaaService.getHistoricalWeather(
    location.lat,
    location.lng,
    eventDate
  );
  
  // Calculate deviation
  return {
    historical_average: historicalAvg,
    actual_conditions: actualConditions,
    deviation_percentage: {
      precipitation: calculateDeviation(
        actualConditions.precipitation,
        historicalAvg.precipitation
      ),
      windSpeed: calculateDeviation(
        actualConditions.windSpeed,
        historicalAvg.windSpeed
      )
    },
    conclusion: determineIfAbnormal(actualConditions, historicalAvg)
  };
}
```

## UI Integration

### Quick Weather Fetch Button
```typescript
// In delay documentation form
<Button 
  onClick={async () => {
    setLoading(true);
    const weather = await fetchNOAAWeather(project.latitude, project.longitude);
    
    // Auto-fill form
    setFormData({
      ...formData,
      temperature_high: weather.temperature,
      wind_speed_mph: weather.windSpeed,
      precipitation_inches: weather.precipitation,
      has_lightning: weather.lightning,
      noaa_station: weather.station,
      noaa_report_url: weather.url
    });
    
    // Show violations
    if (weather.violations.length > 0) {
      showAlert(`Weather exceeds thresholds: ${weather.violations.join(', ')}`);
    }
    
    setLoading(false);
  }}
>
  <CloudRain className="mr-2 h-4 w-4" />
  Fetch Current NOAA Data
</Button>
```

### Report Generation
```typescript
// When generating insurance report
const report = {
  // ... other report data
  
  weather_verification: {
    source: 'NOAA',
    stations_used: delays.map(d => ({
      station_id: d.weather_station_id,
      station_name: d.weather_station_name,
      distance_miles: d.station_distance,
      data_quality: 'Official Government Source'
    })),
    
    // Include raw METAR for aviation-related claims
    raw_observations: delays.map(d => d.raw_metar),
    
    // Historical comparison
    abnormal_weather_analysis: await generateAbnormalWeatherReport(
      project.location,
      delay.date
    ),
    
    // Direct links for adjuster verification
    verification_urls: delays.map(d => ({
      date: d.date,
      noaa_url: d.noaa_report_url,
      archived_url: `https://www.ncdc.noaa.gov/orders/`, // For ordering certified copies
    }))
  }
};
```

## Error Handling

```typescript
async function fetchWeatherWithFallback(lat: number, lng: number, date: Date) {
  try {
    // Try primary NOAA API
    return await noaaService.getCurrentWeather(lat, lng);
  } catch (error) {
    console.error('NOAA API failed:', error);
    
    // Fallback to Climate Data Online
    try {
      return await noaaService.getHistoricalWeather(lat, lng, date);
    } catch (cdoError) {
      console.error('CDO API failed:', cdoError);
      
      // Final fallback - nearest airport
      const airport = await findNearestAirport(lat, lng);
      return await noaaService.getAirportWeather(airport.code);
    }
  }
}
```

## Caching Strategy

```typescript
// Cache NOAA data to avoid hitting rate limits
const weatherCache = new Map();

function getCacheKey(lat: number, lng: number, date: Date) {
  return `${lat.toFixed(4)}_${lng.toFixed(4)}_${format(date, 'yyyy-MM-dd-HH')}`;
}

async function getCachedWeather(lat: number, lng: number, date: Date) {
  const key = getCacheKey(lat, lng, date);
  
  if (weatherCache.has(key)) {
    const cached = weatherCache.get(key);
    const age = Date.now() - cached.timestamp;
    
    // Cache for 1 hour for current, 24 hours for historical
    const maxAge = isToday(date) ? 3600000 : 86400000;
    
    if (age < maxAge) {
      return cached.data;
    }
  }
  
  const data = await fetchWeatherWithFallback(lat, lng, date);
  weatherCache.set(key, { data, timestamp: Date.now() });
  
  return data;
}
```

## Database Storage

```sql
-- Store NOAA verification data
ALTER TABLE weather_readings ADD COLUMN IF NOT EXISTS noaa_observation_url TEXT;
ALTER TABLE weather_readings ADD COLUMN IF NOT EXISTS metar_raw TEXT;
ALTER TABLE weather_readings ADD COLUMN IF NOT EXISTS quality_control_flag VARCHAR(10);

-- Store station info for verification
ALTER TABLE weather_readings ADD COLUMN IF NOT EXISTS station_name VARCHAR(255);
ALTER TABLE weather_readings ADD COLUMN IF NOT EXISTS station_elevation_ft INTEGER;
```

## Legal Compliance

1. **Data Attribution**: Always include "Source: NOAA/National Weather Service"
2. **No Modification**: Present data exactly as received
3. **Retention**: Keep raw API responses for 7 years
4. **Certification**: For legal proceedings, order certified weather records

## Cost Considerations

- **API Access**: Free for reasonable use
- **Certified Records**: ~$50 per official report from NCDC
- **Storage**: Minimal (JSON responses ~2KB each)

## Next Steps

1. Register for NOAA Climate Data Online API token
2. Implement basic weather fetching service
3. Add caching layer
4. Create UI components for weather fetching
5. Update report generation to include NOAA data
6. Test with insurance company requirements