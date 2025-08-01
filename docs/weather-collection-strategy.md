# Weather Collection Strategy for WeatherProof

## Collection Frequency

### Base Schedule
```yaml
Work Hours (6 AM - 6 PM Mon-Fri):
  - Every 30 minutes for active projects
  - Captures rapidly changing conditions during work

Off Hours (Nights/Weekends):
  - Every 2 hours
  - Still captures major events without overwhelming storage

Severe Weather Mode:
  - Every 15 minutes when alerts active
  - Triggered by any weather alert for project area
```

### Why Hourly Isn't Enough
1. **Thunderstorms** can develop and pass in 30-45 minutes
2. **Temperature swings** happen quickly in morning/evening
3. **Wind gusts** may only last 20-30 minutes
4. **Legal documentation** needs precise timing

## N8N Job Structure

### 1. Main Collection Job (Runs every 15 minutes)
```javascript
// Pseudo-code for n8n workflow
async function collectWeatherData() {
  // Get projects that need collection
  const projects = await getActiveProjects()
  
  // Group by NOAA grid to minimize API calls
  const gridGroups = groupProjectsByGrid(projects)
  
  for (const grid of gridGroups) {
    // One API call serves multiple projects
    const weather = await fetchNOAAData(grid)
    const alerts = await fetchNOAAAlerts(grid)
    
    // Store for each project in this grid
    for (const project of grid.projects) {
      if (shouldCollectNow(project, weather, alerts)) {
        await storeWeatherData(project.id, weather, alerts)
      }
    }
  }
}
```

### 2. Smart Collection Rules
```javascript
function shouldCollectNow(project, weather, alerts) {
  const now = new Date()
  const lastCollection = project.last_weather_collection
  const minutesSinceLastCollection = (now - lastCollection) / 60000
  
  // Always collect if:
  if (alerts.length > 0) return true // Any active alert
  if (weather.precipitation > 0) return true // Any precipitation
  if (weather.windSpeed > 20) return true // High winds
  if (weather.temperature < 35 || weather.temperature > 90) return true // Extreme temps
  
  // Otherwise follow schedule
  const isWorkHours = isWithinWorkHours(now, project)
  const requiredInterval = isWorkHours ? 30 : 120 // minutes
  
  return minutesSinceLastCollection >= requiredInterval
}
```

## Database Schema

### Weather Readings Table
```sql
CREATE TABLE weather_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  collected_at TIMESTAMPTZ NOT NULL,
  
  -- Weather data
  temperature NUMERIC(5,2),
  feels_like NUMERIC(5,2),
  humidity INTEGER,
  wind_speed NUMERIC(5,2),
  wind_gust NUMERIC(5,2),
  wind_direction VARCHAR(10),
  precipitation_rate NUMERIC(5,2), -- inches per hour
  precipitation_type VARCHAR(20), -- rain, snow, sleet, freezing
  visibility NUMERIC(5,2), -- miles
  cloud_cover INTEGER, -- percentage
  conditions TEXT[], -- ["rain", "fog", "cloudy"]
  
  -- Alert data
  has_alerts BOOLEAN DEFAULT false,
  alert_count INTEGER DEFAULT 0,
  highest_severity VARCHAR(20), -- Extreme, Severe, Moderate, Minor
  
  -- Change tracking
  significant_change BOOLEAN DEFAULT false,
  change_reasons TEXT[], -- ["temp_drop_10", "rain_started", "wind_increase"]
  
  -- Metadata
  data_source VARCHAR(20), -- forecast, observation
  station_id VARCHAR(10),
  raw_data JSONB, -- Full API response
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_project_time (project_id, collected_at DESC),
  INDEX idx_significant (project_id, significant_change) WHERE significant_change = true,
  INDEX idx_alerts (project_id, has_alerts) WHERE has_alerts = true
);

-- Alerts table (separate for normalization)
CREATE TABLE weather_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reading_id UUID REFERENCES weather_readings(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  alert_id VARCHAR(100) UNIQUE, -- NOAA alert ID
  event_type VARCHAR(50), -- Flood Watch, High Wind Warning, etc
  severity VARCHAR(20), -- Extreme, Severe, Moderate, Minor
  urgency VARCHAR(20), -- Immediate, Expected, Future
  certainty VARCHAR(20), -- Observed, Likely, Possible
  
  headline TEXT,
  description TEXT,
  
  onset TIMESTAMPTZ,
  expires TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_project_alerts (project_id, expires DESC),
  INDEX idx_active_alerts (project_id, expires) WHERE expires > NOW()
);
```

### Summary Tables for Performance
```sql
-- Daily summaries (auto-generated)
CREATE MATERIALIZED VIEW daily_weather_summary AS
SELECT 
  project_id,
  DATE(collected_at) as date,
  
  -- Temperature
  MIN(temperature) as temp_min,
  MAX(temperature) as temp_max,
  AVG(temperature) as temp_avg,
  
  -- Wind
  MAX(wind_speed) as wind_max,
  AVG(wind_speed) as wind_avg,
  
  -- Precipitation
  SUM(precipitation_rate) as total_precipitation,
  COUNT(*) FILTER (WHERE precipitation_rate > 0) as hours_with_precipitation,
  
  -- Work impact
  COUNT(*) FILTER (WHERE 
    temperature < 40 OR temperature > 85 OR
    wind_speed > 25 OR
    precipitation_rate > 0.1
  ) as impacted_hours,
  
  -- Alerts
  COUNT(DISTINCT wa.alert_id) as unique_alerts,
  MAX(wa.severity) as highest_alert_severity,
  
  -- Conditions
  ARRAY_AGG(DISTINCT unnest(conditions)) as all_conditions

FROM weather_readings wr
LEFT JOIN weather_alerts wa ON wr.id = wa.reading_id
WHERE collected_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY project_id, DATE(collected_at);

-- Refresh daily at 2 AM
CREATE INDEX ON daily_weather_summary(project_id, date DESC);
```

## Collection Optimization

### 1. Batch by Grid Cell
```sql
-- View to group active projects by NOAA grid
CREATE VIEW active_projects_by_grid AS
SELECT 
  cached_grid_id,
  cached_grid_x,
  cached_grid_y,
  ARRAY_AGG(id) as project_ids,
  COUNT(*) as project_count,
  MIN(
    CASE 
      WHEN has_active_alert THEN 15  -- 15 min if alerts
      WHEN EXTRACT(hour FROM NOW()) BETWEEN 6 AND 18 
        AND EXTRACT(dow FROM NOW()) BETWEEN 1 AND 5 
      THEN 30  -- 30 min during work hours
      ELSE 120 -- 2 hours otherwise
    END
  ) as collection_interval_minutes
FROM projects
WHERE status = 'active' 
  AND weather_collection_enabled = true
  AND cached_grid_id IS NOT NULL
GROUP BY cached_grid_id, cached_grid_x, cached_grid_y;
```

### 2. Change Detection
```javascript
// Only store if significant change
function detectSignificantChange(current, previous) {
  if (!previous) return true
  
  const changes = []
  
  // Temperature change > 5°F
  if (Math.abs(current.temperature - previous.temperature) > 5) {
    changes.push('temp_change_5')
  }
  
  // Precipitation started/stopped
  if (current.precipitation > 0 && previous.precipitation === 0) {
    changes.push('rain_started')
  } else if (current.precipitation === 0 && previous.precipitation > 0) {
    changes.push('rain_stopped')
  }
  
  // Wind increase > 10 mph
  if (current.windSpeed - previous.windSpeed > 10) {
    changes.push('wind_increase_10')
  }
  
  // New alert
  if (current.alerts.length > previous.alerts.length) {
    changes.push('new_alert')
  }
  
  return {
    hasChange: changes.length > 0,
    reasons: changes
  }
}
```

## Storage Management

### Data Retention Policy
```sql
-- Keep different granularities
CREATE OR REPLACE FUNCTION cleanup_weather_data() RETURNS void AS $$
BEGIN
  -- Keep all data for 7 days
  -- Keep hourly for 30 days
  DELETE FROM weather_readings 
  WHERE collected_at < NOW() - INTERVAL '30 days'
    AND significant_change = false
    AND EXTRACT(minute FROM collected_at) != 0;
  
  -- Keep only significant changes after 30 days
  DELETE FROM weather_readings
  WHERE collected_at < NOW() - INTERVAL '90 days'
    AND significant_change = false;
  
  -- Archive to cold storage after 1 year
  INSERT INTO weather_archive 
  SELECT * FROM weather_readings 
  WHERE collected_at < NOW() - INTERVAL '1 year';
  
  DELETE FROM weather_readings 
  WHERE collected_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Run daily at 3 AM
SELECT cron.schedule('cleanup-weather', '0 3 * * *', 'SELECT cleanup_weather_data()');
```

## Usage in Delay Documentation

```javascript
// When user documents a delay
async function getWeatherForDelay(projectId, date, startTime, endTime) {
  // Get actual recorded data
  const recordings = await db.query(`
    SELECT 
      collected_at,
      temperature,
      wind_speed,
      precipitation_rate,
      conditions,
      alert_count
    FROM weather_readings
    WHERE project_id = $1
      AND collected_at BETWEEN $2 AND $3
    ORDER BY collected_at
  `, [projectId, startTime, endTime])
  
  // Aggregate for the period
  return {
    readings: recordings,
    summary: {
      tempMin: Math.min(...recordings.map(r => r.temperature)),
      tempMax: Math.max(...recordings.map(r => r.temperature)),
      maxWind: Math.max(...recordings.map(r => r.wind_speed)),
      totalPrecipitation: recordings.reduce((sum, r) => sum + r.precipitation_rate, 0),
      conditions: [...new Set(recordings.flatMap(r => r.conditions))],
      hadAlerts: recordings.some(r => r.alert_count > 0)
    }
  }
}
```

## Key Benefits

1. **Complete Coverage**: Captures all weather, not just alerts
2. **Legal Protection**: Timestamped records every 30 min during work
3. **Efficient Storage**: Only stores significant changes long-term
4. **Fast Queries**: Indexed for quick delay documentation
5. **Cost Effective**: Groups projects by grid to minimize API calls