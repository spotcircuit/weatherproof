-- Add timezone support to projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'America/New_York';

-- Add index for timezone queries
CREATE INDEX IF NOT EXISTS idx_projects_timezone ON projects(timezone);

-- Function to determine timezone from coordinates
CREATE OR REPLACE FUNCTION get_timezone_from_coordinates(
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION
) RETURNS TEXT AS $$
BEGIN
  -- This is a simplified version - in production you'd use a proper timezone API
  -- For now, using rough US timezone boundaries
  
  -- Alaska
  IF lat > 51 AND lon < -130 THEN
    RETURN 'America/Anchorage';
  -- Hawaii
  ELSIF lat < 23 AND lat > 18 AND lon < -154 THEN
    RETURN 'America/Honolulu';
  -- Pacific Time
  ELSIF lon < -115 THEN
    RETURN 'America/Los_Angeles';
  -- Mountain Time (considering Arizona doesn't observe DST)
  ELSIF lon < -102 THEN
    IF lat < 37 AND lat > 31 AND lon > -114 AND lon < -109 THEN
      RETURN 'America/Phoenix'; -- Arizona
    ELSE
      RETURN 'America/Denver';
    END IF;
  -- Central Time
  ELSIF lon < -87 THEN
    RETURN 'America/Chicago';
  -- Eastern Time
  ELSE
    RETURN 'America/New_York';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update existing projects based on their coordinates
UPDATE projects 
SET timezone = get_timezone_from_coordinates(latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- For Texas projects specifically (since you have many)
UPDATE projects 
SET timezone = 'America/Chicago'
WHERE (address ILIKE '%TX%' OR address ILIKE '%Texas%' OR 
       address ILIKE '%Houston%' OR address ILIKE '%Dallas%' OR 
       address ILIKE '%Austin%' OR address ILIKE '%San Antonio%' OR
       address ILIKE '%Fort Worth%')
  AND timezone = 'America/New_York';

-- Add trigger to automatically set timezone when project is created/updated
CREATE OR REPLACE FUNCTION set_project_timezone()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if coordinates are provided and timezone hasn't been manually set
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL AND 
     (OLD.timezone IS NULL OR OLD.timezone = 'America/New_York' OR 
      OLD.latitude IS DISTINCT FROM NEW.latitude OR 
      OLD.longitude IS DISTINCT FROM NEW.longitude) THEN
    NEW.timezone = get_timezone_from_coordinates(NEW.latitude, NEW.longitude);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_project_timezone_trigger
  BEFORE INSERT OR UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_project_timezone();

-- Function to get local time for any timestamp in a project's timezone
CREATE OR REPLACE FUNCTION get_project_local_time(
  p_project_id UUID,
  p_utc_time TIMESTAMPTZ DEFAULT NOW()
) RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_timezone TEXT;
BEGIN
  SELECT timezone INTO v_timezone
  FROM projects
  WHERE id = p_project_id;
  
  RETURN p_utc_time AT TIME ZONE COALESCE(v_timezone, 'America/New_York');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add computed column for weather collection in local time
ALTER TABLE project_weather
ADD COLUMN IF NOT EXISTS local_collected_at TIMESTAMPTZ GENERATED ALWAYS AS (
  collected_at AT TIME ZONE COALESCE(
    (SELECT timezone FROM projects WHERE id = project_id),
    'America/New_York'
  )
) STORED;

-- Add comment explaining the timezone field
COMMENT ON COLUMN projects.timezone IS 'IANA timezone identifier for the project location. Automatically determined from coordinates. Used for accurate weather delay timing and work hour calculations.';

-- Helper view for weather with local times
CREATE OR REPLACE VIEW project_weather_local AS
SELECT 
  pw.*,
  p.timezone,
  pw.collected_at AT TIME ZONE p.timezone as local_time,
  TO_CHAR(pw.collected_at AT TIME ZONE p.timezone, 'MM/DD/YYYY HH12:MI AM') as local_time_formatted
FROM project_weather pw
JOIN projects p ON p.id = pw.project_id;