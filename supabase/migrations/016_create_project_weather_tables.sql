-- Migration: Create project weather tracking tables
-- Description: Store weather data from NOAA API for construction projects

-- Main weather data table
CREATE TABLE project_weather (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  collected_at TIMESTAMPTZ NOT NULL,
  
  -- Temperature data (Fahrenheit)
  temperature NUMERIC(5,2),
  temperature_unit VARCHAR(10) DEFAULT 'F',
  feels_like NUMERIC(5,2),
  temperature_min NUMERIC(5,2), -- For daily summaries
  temperature_max NUMERIC(5,2), -- For daily summaries
  
  -- Wind data
  wind_speed NUMERIC(5,2), -- mph
  wind_gust NUMERIC(5,2), -- mph
  wind_direction VARCHAR(10), -- N, NE, E, SE, S, SW, W, NW
  
  -- Precipitation
  precipitation_probability INTEGER CHECK (precipitation_probability >= 0 AND precipitation_probability <= 100),
  precipitation_amount NUMERIC(5,3), -- inches per hour
  precipitation_type VARCHAR(20), -- rain, snow, sleet, freezing_rain
  
  -- Other conditions
  humidity INTEGER CHECK (humidity >= 0 AND humidity <= 100),
  visibility NUMERIC(5,2), -- miles
  cloud_cover INTEGER CHECK (cloud_cover >= 0 AND cloud_cover <= 100),
  uv_index NUMERIC(3,1),
  
  -- Text descriptions from NOAA
  short_forecast TEXT,
  detailed_forecast TEXT,
  
  -- Parsed conditions array
  conditions TEXT[], -- ['rain', 'fog', 'thunder', etc]
  
  -- Construction impact flags (parsed from data)
  impacts_concrete BOOLEAN DEFAULT false, -- temp < 40 or > 90
  impacts_roofing BOOLEAN DEFAULT false, -- any precipitation or wind > 20
  impacts_crane BOOLEAN DEFAULT false, -- wind > 20 or gusts > 25
  impacts_electrical BOOLEAN DEFAULT false, -- precipitation or lightning
  impacts_painting BOOLEAN DEFAULT false, -- temp out of range, high humidity, or wind
  
  -- Alert tracking
  has_alerts BOOLEAN DEFAULT false,
  alert_count INTEGER DEFAULT 0,
  highest_alert_severity VARCHAR(20), -- Extreme, Severe, Moderate, Minor
  
  -- Change tracking
  significant_change BOOLEAN DEFAULT false,
  change_from_previous JSONB, -- {"temp_change": 10, "wind_change": 15, etc}
  
  -- Source info
  data_source VARCHAR(20) DEFAULT 'forecast', -- forecast, observation, manual
  station_id VARCHAR(10), -- For observations
  grid_id VARCHAR(10), -- NOAA grid office
  grid_x INTEGER,
  grid_y INTEGER,
  
  -- Raw data for reference/debugging
  raw_data JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Add constraint to prevent duplicate entries
  CONSTRAINT unique_project_weather_time UNIQUE (project_id, collected_at, data_source)
);

-- Indexes for performance
CREATE INDEX idx_project_weather_lookup ON project_weather(project_id, collected_at DESC);
CREATE INDEX idx_project_weather_significant ON project_weather(project_id, significant_change) WHERE significant_change = true;
CREATE INDEX idx_project_weather_alerts ON project_weather(project_id, has_alerts) WHERE has_alerts = true;
CREATE INDEX idx_project_weather_impacts ON project_weather(project_id, collected_at) 
  WHERE impacts_concrete OR impacts_roofing OR impacts_crane OR impacts_electrical OR impacts_painting;

-- Separate alerts table for normalization
CREATE TABLE project_weather_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weather_id UUID REFERENCES project_weather(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- NOAA alert identifiers
  alert_id VARCHAR(200) UNIQUE,
  event_type VARCHAR(100), -- Flood Watch, High Wind Warning, etc
  
  -- Alert severity/urgency
  severity VARCHAR(20), -- Extreme, Severe, Moderate, Minor
  urgency VARCHAR(20), -- Immediate, Expected, Future, Past
  certainty VARCHAR(20), -- Observed, Likely, Possible
  
  -- Alert content
  headline TEXT,
  description TEXT,
  instruction TEXT,
  
  -- Alert timing
  onset TIMESTAMPTZ,
  expires TIMESTAMPTZ,
  
  -- Areas affected (could be useful for multi-site projects)
  areas TEXT[],
  
  -- Raw alert data
  raw_alert JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for alerts
CREATE INDEX idx_weather_alerts_project ON project_weather_alerts(project_id, expires DESC);
CREATE INDEX idx_weather_alerts_active ON project_weather_alerts(project_id, onset, expires);

-- Add weather collection settings to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS weather_collection_enabled BOOLEAN DEFAULT true;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS weather_collection_frequency INTEGER DEFAULT 30; -- minutes
ALTER TABLE projects ADD COLUMN IF NOT EXISTS weather_last_collected_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS weather_collection_start_time TIME DEFAULT '06:00';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS weather_collection_end_time TIME DEFAULT '18:00';

-- Function to check if weather impacts construction
CREATE OR REPLACE FUNCTION check_weather_impacts(weather_data project_weather)
RETURNS project_weather AS $$
BEGIN
  -- Check temperature impacts
  IF weather_data.temperature IS NOT NULL AND (weather_data.temperature < 40 OR weather_data.temperature > 90) THEN
    weather_data.impacts_concrete = true;
  END IF;
  
  -- Check roofing impacts
  IF COALESCE(weather_data.precipitation_probability, 0) > 30 OR 
     COALESCE(weather_data.precipitation_amount, 0) > 0 OR
     COALESCE(weather_data.wind_speed, 0) > 20 OR
     (weather_data.conditions IS NOT NULL AND weather_data.conditions && ARRAY['rain', 'snow', 'lightning']) THEN
    weather_data.impacts_roofing = true;
  END IF;
  
  -- Check crane impacts
  IF COALESCE(weather_data.wind_speed, 0) > 20 OR COALESCE(weather_data.wind_gust, 0) > 25 THEN
    weather_data.impacts_crane = true;
  END IF;
  
  -- Check electrical impacts
  IF COALESCE(weather_data.precipitation_amount, 0) > 0 OR 
     (weather_data.conditions IS NOT NULL AND weather_data.conditions && ARRAY['lightning', 'thunder']) THEN
    weather_data.impacts_electrical = true;
  END IF;
  
  -- Check painting impacts
  IF (weather_data.temperature IS NOT NULL AND (weather_data.temperature < 50 OR weather_data.temperature > 90)) OR
     COALESCE(weather_data.humidity, 0) > 85 OR
     COALESCE(weather_data.wind_speed, 0) > 15 OR
     COALESCE(weather_data.precipitation_amount, 0) > 0 THEN
    weather_data.impacts_painting = true;
  END IF;
  
  RETURN weather_data;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically check impacts
CREATE OR REPLACE FUNCTION check_weather_impacts_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW := check_weather_impacts(NEW);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_weather_impacts_trigger
  BEFORE INSERT OR UPDATE ON project_weather
  FOR EACH ROW
  EXECUTE FUNCTION check_weather_impacts_trigger();

-- Function to detect significant changes
CREATE OR REPLACE FUNCTION detect_weather_changes()
RETURNS TRIGGER AS $$
DECLARE
  prev_weather project_weather;
  temp_change NUMERIC;
  wind_change NUMERIC;
BEGIN
  -- Get the most recent weather entry for this project
  SELECT * INTO prev_weather
  FROM project_weather
  WHERE project_id = NEW.project_id
    AND collected_at < NEW.collected_at
    AND data_source = NEW.data_source
  ORDER BY collected_at DESC
  LIMIT 1;
  
  -- If no previous record, this is significant
  IF prev_weather IS NULL THEN
    NEW.significant_change = true;
    RETURN NEW;
  END IF;
  
  -- Calculate changes
  temp_change = ABS(COALESCE(NEW.temperature, 0) - COALESCE(prev_weather.temperature, 0));
  wind_change = ABS(COALESCE(NEW.wind_speed, 0) - COALESCE(prev_weather.wind_speed, 0));
  
  -- Check for significant changes
  IF temp_change > 5 OR  -- 5°F change
     wind_change > 10 OR  -- 10 mph change
     (NEW.precipitation_amount > 0 AND prev_weather.precipitation_amount = 0) OR  -- Rain started
     (NEW.precipitation_amount = 0 AND prev_weather.precipitation_amount > 0) OR  -- Rain stopped
     NEW.has_alerts != prev_weather.has_alerts OR  -- Alert status changed
     NEW.conditions IS DISTINCT FROM prev_weather.conditions THEN  -- Conditions changed
    
    NEW.significant_change = true;
    NEW.change_from_previous = jsonb_build_object(
      'temperature_change', temp_change,
      'wind_change', wind_change,
      'precipitation_started', (NEW.precipitation_amount > 0 AND prev_weather.precipitation_amount = 0),
      'precipitation_stopped', (NEW.precipitation_amount = 0 AND prev_weather.precipitation_amount > 0),
      'alert_change', NEW.has_alerts != prev_weather.has_alerts
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to detect changes
CREATE TRIGGER detect_weather_changes_trigger
  BEFORE INSERT ON project_weather
  FOR EACH ROW
  EXECUTE FUNCTION detect_weather_changes();

-- View for current weather conditions
CREATE VIEW project_current_weather AS
SELECT DISTINCT ON (project_id)
  pw.*,
  p.name as project_name,
  p.address as project_address,
  p.active as project_active
FROM project_weather pw
JOIN projects p ON p.id = pw.project_id
WHERE p.active = true
ORDER BY pw.project_id, pw.collected_at DESC;

-- Materialized view for daily summaries
CREATE MATERIALIZED VIEW project_weather_daily AS
SELECT 
  pw.project_id,
  DATE(pw.collected_at) as weather_date,
  
  -- Temperature summary
  MIN(pw.temperature) as temp_min,
  MAX(pw.temperature) as temp_max,
  AVG(pw.temperature) as temp_avg,
  
  -- Wind summary
  MAX(pw.wind_speed) as wind_max,
  AVG(pw.wind_speed) as wind_avg,
  MAX(pw.wind_gust) as wind_gust_max,
  
  -- Precipitation summary
  MAX(pw.precipitation_probability) as precip_probability_max,
  SUM(pw.precipitation_amount) as precip_total,
  COUNT(*) FILTER (WHERE pw.precipitation_amount > 0) as hours_with_precip,
  
  -- Work impact hours
  COUNT(*) FILTER (WHERE pw.impacts_concrete) as concrete_impact_hours,
  COUNT(*) FILTER (WHERE pw.impacts_roofing) as roofing_impact_hours,
  COUNT(*) FILTER (WHERE pw.impacts_crane) as crane_impact_hours,
  COUNT(*) FILTER (WHERE pw.impacts_electrical) as electrical_impact_hours,
  COUNT(*) FILTER (WHERE pw.impacts_painting) as painting_impact_hours,
  
  -- Alert summary
  COUNT(DISTINCT pwa.alert_id) as unique_alerts,
  MAX(pw.highest_alert_severity) as max_alert_severity,
  
  -- Conditions summary (concatenated as we can't unnest in aggregate)
  STRING_AGG(DISTINCT array_to_string(pw.conditions, ','), ',') as all_conditions_text,
  
  -- Data points
  COUNT(*) as reading_count,
  MAX(pw.collected_at) as last_updated

FROM project_weather pw
LEFT JOIN project_weather_alerts pwa ON pw.id = pwa.weather_id
WHERE pw.collected_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY pw.project_id, DATE(pw.collected_at);

-- Index for daily view
CREATE UNIQUE INDEX idx_weather_daily ON project_weather_daily(project_id, weather_date DESC);

-- Function to get weather for delay documentation
CREATE OR REPLACE FUNCTION get_weather_for_delay(
  p_project_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME
)
RETURNS TABLE (
  collected_at TIMESTAMPTZ,
  temperature NUMERIC,
  wind_speed NUMERIC,
  precipitation_amount NUMERIC,
  conditions TEXT[],
  has_alerts BOOLEAN,
  short_forecast TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pw.collected_at,
    pw.temperature,
    pw.wind_speed,
    pw.precipitation_amount,
    pw.conditions,
    pw.has_alerts,
    pw.short_forecast
  FROM project_weather pw
  WHERE pw.project_id = p_project_id
    AND pw.collected_at >= (p_date + p_start_time)::timestamptz
    AND pw.collected_at <= (p_date + p_end_time)::timestamptz
  ORDER BY pw.collected_at;
END;
$$ LANGUAGE plpgsql;

-- RLS policies
ALTER TABLE project_weather ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_weather_alerts ENABLE ROW LEVEL SECURITY;

-- Users can view weather for their projects
CREATE POLICY "Users can view project weather"
  ON project_weather FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_weather.project_id
        AND p.user_id = auth.uid()
    )
  );

-- Only system can insert weather data (via service role)
CREATE POLICY "System can insert weather"
  ON project_weather FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Similar policies for alerts
CREATE POLICY "Users can view weather alerts"
  ON project_weather_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_weather_alerts.project_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage alerts"
  ON project_weather_alerts FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Grant permissions
GRANT SELECT ON project_weather TO authenticated;
GRANT SELECT ON project_weather_alerts TO authenticated;
GRANT SELECT ON project_current_weather TO authenticated;
GRANT SELECT ON project_weather_daily TO authenticated;

-- Comments for documentation
COMMENT ON TABLE project_weather IS 'Stores weather data collected from NOAA API for construction projects';
COMMENT ON TABLE project_weather_alerts IS 'Stores weather alerts and warnings for projects';
COMMENT ON COLUMN project_weather.impacts_concrete IS 'True if weather conditions prevent concrete work (temp < 40°F or > 90°F)';
COMMENT ON COLUMN project_weather.impacts_roofing IS 'True if weather conditions prevent roofing (precipitation or wind > 20mph)';
COMMENT ON COLUMN project_weather.impacts_crane IS 'True if weather conditions prevent crane operations (wind > 20mph or gusts > 25mph)';
COMMENT ON COLUMN project_weather.significant_change IS 'True if weather changed significantly from previous reading';