-- Add summary fields to project_weather table for better display
ALTER TABLE project_weather
  ADD COLUMN IF NOT EXISTS alert_summary TEXT,
  ADD COLUMN IF NOT EXISTS forecast_summary TEXT;

-- Create a function to populate summary fields from related data
CREATE OR REPLACE FUNCTION populate_weather_summaries()
RETURNS TRIGGER AS $$
BEGIN
  -- If there are alerts, create a summary
  IF NEW.has_alerts THEN
    SELECT 
      string_agg(
        COALESCE(event_type, 'Weather Alert') || 
        CASE 
          WHEN severity IS NOT NULL THEN ' (' || severity || ')' 
          ELSE '' 
        END,
        '; '
      ) INTO NEW.alert_summary
    FROM project_weather_alerts
    WHERE weather_id = NEW.id;
  END IF;

  -- Create forecast summary from conditions and short forecast
  IF NEW.short_forecast IS NOT NULL OR array_length(NEW.conditions, 1) > 0 THEN
    NEW.forecast_summary = COALESCE(
      NEW.short_forecast,
      array_to_string(NEW.conditions, ', ')
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-populate summaries
CREATE TRIGGER populate_weather_summaries_trigger
BEFORE INSERT OR UPDATE ON project_weather
FOR EACH ROW
EXECUTE FUNCTION populate_weather_summaries();

-- Update existing records
UPDATE project_weather pw
SET 
  alert_summary = (
    SELECT string_agg(
      COALESCE(event_type, 'Weather Alert') || 
      CASE 
        WHEN severity IS NOT NULL THEN ' (' || severity || ')' 
        ELSE '' 
      END,
      '; '
    )
    FROM project_weather_alerts
    WHERE weather_id = pw.id
  ),
  forecast_summary = COALESCE(
    short_forecast,
    array_to_string(conditions, ', ')
  )
WHERE alert_summary IS NULL OR forecast_summary IS NULL;