-- Enable pg_net for HTTP calls from database
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to call weather webhook directly
CREATE OR REPLACE FUNCTION trigger_weather_collection()
RETURNS trigger AS $$
DECLARE
  request_id BIGINT;
BEGIN
  -- Only proceed if this is a new weather collection need
  IF (NEW.weather_collection_enabled = true AND 
      NEW.latitude IS NOT NULL AND 
      NEW.longitude IS NOT NULL AND
      NEW.active = true) AND
     (TG_OP = 'INSERT' OR 
      (TG_OP = 'UPDATE' AND (
        OLD.weather_collection_enabled = false OR
        OLD.active = false OR
        OLD.latitude IS NULL OR
        OLD.longitude IS NULL
      ))) THEN
    
    -- Call your existing webhook using pg_net
    SELECT net.http_post(
      url := 'https://n8n.spotcircuit.com/webhook/Weather-Lookup',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'LongBeach2023!'
      ),
      body := jsonb_build_object(
        'projectId', NEW.id::text,
        'latitude', NEW.latitude,
        'longitude', NEW.longitude,
        'requestType', 'scheduled',
        'includeAlerts', true,
        'includeHourly', false,
        'storeResult', true
      )
    ) INTO request_id;
    
    -- Log the request
    RAISE NOTICE 'Weather collection triggered for project % (request_id: %)', NEW.name, request_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for immediate weather collection
DROP TRIGGER IF EXISTS trigger_immediate_weather ON projects;
CREATE TRIGGER trigger_immediate_weather
  AFTER INSERT OR UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION trigger_weather_collection();

-- Function for scheduled weather collection
-- This will be called by pg_cron every 30 minutes
CREATE OR REPLACE FUNCTION scheduled_weather_collection()
RETURNS void AS $$
DECLARE
  project RECORD;
  request_id BIGINT;
  collection_count INTEGER := 0;
BEGIN
  -- Loop through all projects needing weather updates
  FOR project IN 
    SELECT id, name, latitude, longitude
    FROM projects
    WHERE active = true
      AND weather_collection_enabled = true
      AND latitude IS NOT NULL
      AND longitude IS NOT NULL
      AND (
        weather_last_collected_at IS NULL OR
        weather_last_collected_at < NOW() - INTERVAL '1 minute' * COALESCE(weather_collection_frequency, 30)
      )
  LOOP
    -- Call webhook for each project
    SELECT net.http_post(
      url := 'https://n8n.spotcircuit.com/webhook/Weather-Lookup',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'LongBeach2023!'
      ),
      body := jsonb_build_object(
        'projectId', project.id::text,
        'latitude', project.latitude,
        'longitude', project.longitude,
        'requestType', 'scheduled',
        'includeAlerts', true,
        'includeHourly', false,
        'storeResult', true
      )
    ) INTO request_id;
    
    collection_count := collection_count + 1;
    
    -- Update last collected timestamp
    UPDATE projects 
    SET weather_last_collected_at = NOW()
    WHERE id = project.id;
    
  END LOOP;
  
  RAISE NOTICE 'Scheduled weather collection completed. Processed % projects', collection_count;
END;
$$ LANGUAGE plpgsql;

-- Install pg_cron if not already installed
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the weather collection to run every 30 minutes
-- Note: This requires pg_cron to be enabled in your Supabase project
SELECT cron.schedule(
  'collect-weather-every-30-min',
  '*/30 * * * *',
  $$SELECT scheduled_weather_collection();$$
);

-- Function to check webhook response status
-- You can query this table to see webhook call results
CREATE TABLE IF NOT EXISTS weather_webhook_log (
  id SERIAL PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  request_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT
);

-- Function to check webhook responses
CREATE OR REPLACE FUNCTION check_webhook_responses()
RETURNS TABLE (
  request_id BIGINT,
  status_code INTEGER,
  response JSONB,
  created TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id as request_id,
    status_code,
    content::jsonb as response,
    created
  FROM net._http_response
  WHERE created > NOW() - INTERVAL '1 hour'
  ORDER BY created DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION scheduled_weather_collection() TO postgres;
GRANT EXECUTE ON FUNCTION check_webhook_responses() TO authenticated;

-- Comments
COMMENT ON FUNCTION trigger_weather_collection() IS 'Immediately calls weather webhook when project is enabled';
COMMENT ON FUNCTION scheduled_weather_collection() IS 'Called by pg_cron every 30 minutes to update all project weather';
COMMENT ON FUNCTION check_webhook_responses() IS 'View recent webhook call results';