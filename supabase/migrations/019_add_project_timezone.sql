-- Add timezone support to projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'America/New_York';

-- Add index for timezone queries
CREATE INDEX IF NOT EXISTS idx_projects_timezone ON projects(timezone);

-- Update existing projects based on their state
-- This is just a starting point - users can update these
UPDATE projects 
SET timezone = CASE 
  WHEN address ILIKE '%TX%' OR address ILIKE '%Texas%' THEN 'America/Chicago'
  WHEN address ILIKE '%CA%' OR address ILIKE '%California%' THEN 'America/Los_Angeles'
  WHEN address ILIKE '%NY%' OR address ILIKE '%New York%' THEN 'America/New_York'
  WHEN address ILIKE '%FL%' OR address ILIKE '%Florida%' THEN 'America/New_York'
  WHEN address ILIKE '%AZ%' OR address ILIKE '%Arizona%' THEN 'America/Phoenix'
  WHEN address ILIKE '%CO%' OR address ILIKE '%Colorado%' THEN 'America/Denver'
  ELSE 'America/New_York'
END
WHERE timezone IS NULL OR timezone = 'America/New_York';

-- Add timezone to weather collection for proper display
ALTER TABLE project_weather
ADD COLUMN IF NOT EXISTS local_time TIMESTAMPTZ GENERATED ALWAYS AS (
  collected_at AT TIME ZONE COALESCE(
    (SELECT timezone FROM projects WHERE id = project_id),
    'America/New_York'
  )
) STORED;

-- Add comment explaining the timezone field
COMMENT ON COLUMN projects.timezone IS 'IANA timezone identifier for the project location. Used for accurate weather delay timing and work hour calculations.';

-- Create a function to get local time for a project
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

-- Example: Get current local time for a project
-- SELECT get_project_local_time('project-uuid-here');