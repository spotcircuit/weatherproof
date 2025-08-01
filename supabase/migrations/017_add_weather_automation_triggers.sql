-- Migration: Add weather collection automation triggers
-- Description: Automatically notify when projects need weather collection enabled/disabled

-- Create function to notify about weather collection changes
CREATE OR REPLACE FUNCTION notify_project_weather_change()
RETURNS trigger AS $$
BEGIN
  -- When project is created with weather collection enabled and has coordinates
  IF (TG_OP = 'INSERT' AND 
      NEW.weather_collection_enabled = true AND 
      NEW.latitude IS NOT NULL AND 
      NEW.longitude IS NOT NULL AND
      NEW.active = true) THEN
    
    PERFORM pg_notify('project_weather_enabled', json_build_object(
      'project_id', NEW.id,
      'name', NEW.name,
      'latitude', NEW.latitude,
      'longitude', NEW.longitude,
      'frequency', COALESCE(NEW.weather_collection_frequency, 30),
      'action', 'enable',
      'timestamp', NOW()
    )::text);
  
  -- When weather collection is enabled on existing project
  ELSIF (TG_OP = 'UPDATE' AND 
         OLD.weather_collection_enabled = false AND 
         NEW.weather_collection_enabled = true AND
         NEW.latitude IS NOT NULL AND 
         NEW.longitude IS NOT NULL AND
         NEW.active = true) THEN
    
    PERFORM pg_notify('project_weather_enabled', json_build_object(
      'project_id', NEW.id,
      'name', NEW.name,
      'latitude', NEW.latitude,
      'longitude', NEW.longitude,
      'frequency', COALESCE(NEW.weather_collection_frequency, 30),
      'action', 'enable',
      'timestamp', NOW()
    )::text);
  
  -- When coordinates are added to a project with weather collection already enabled
  ELSIF (TG_OP = 'UPDATE' AND 
         NEW.weather_collection_enabled = true AND
         NEW.active = true AND
         (OLD.latitude IS NULL OR OLD.longitude IS NULL) AND
         NEW.latitude IS NOT NULL AND 
         NEW.longitude IS NOT NULL) THEN
    
    PERFORM pg_notify('project_weather_enabled', json_build_object(
      'project_id', NEW.id,
      'name', NEW.name,
      'latitude', NEW.latitude,
      'longitude', NEW.longitude,
      'frequency', COALESCE(NEW.weather_collection_frequency, 30),
      'action', 'enable',
      'timestamp', NOW()
    )::text);
  
  -- When project is deactivated
  ELSIF (TG_OP = 'UPDATE' AND 
         OLD.active = true AND 
         NEW.active = false AND
         OLD.weather_collection_enabled = true) THEN
    
    PERFORM pg_notify('project_weather_disabled', json_build_object(
      'project_id', NEW.id,
      'name', NEW.name,
      'action', 'disable',
      'reason', 'project_deactivated',
      'timestamp', NOW()
    )::text);
  
  -- When weather collection is explicitly disabled
  ELSIF (TG_OP = 'UPDATE' AND 
         OLD.weather_collection_enabled = true AND 
         NEW.weather_collection_enabled = false AND
         NEW.active = true) THEN
    
    PERFORM pg_notify('project_weather_disabled', json_build_object(
      'project_id', NEW.id,
      'name', NEW.name,
      'action', 'disable',
      'reason', 'weather_collection_disabled',
      'timestamp', NOW()
    )::text);
  
  -- When coordinates are removed
  ELSIF (TG_OP = 'UPDATE' AND 
         NEW.weather_collection_enabled = true AND
         OLD.weather_collection_enabled = true AND
         (OLD.latitude IS NOT NULL AND OLD.longitude IS NOT NULL) AND
         (NEW.latitude IS NULL OR NEW.longitude IS NULL)) THEN
    
    PERFORM pg_notify('project_weather_disabled', json_build_object(
      'project_id', NEW.id,
      'name', NEW.name,
      'action', 'disable',
      'reason', 'coordinates_removed',
      'timestamp', NOW()
    )::text);
  
  -- When project is deleted
  ELSIF (TG_OP = 'DELETE' AND OLD.weather_collection_enabled = true) THEN
    
    PERFORM pg_notify('project_weather_disabled', json_build_object(
      'project_id', OLD.id,
      'name', OLD.name,
      'action', 'disable',
      'reason', 'project_deleted',
      'timestamp', NOW()
    )::text);
    
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for insert and update
DROP TRIGGER IF EXISTS project_weather_automation ON projects;
CREATE TRIGGER project_weather_automation
  AFTER INSERT OR UPDATE OR DELETE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION notify_project_weather_change();

-- Create function to get active weather collection projects
-- This can be called by n8n to get the current list
CREATE OR REPLACE FUNCTION get_active_weather_projects()
RETURNS TABLE (
  project_id UUID,
  name TEXT,
  latitude FLOAT,
  longitude FLOAT,
  frequency INTEGER,
  last_collected TIMESTAMPTZ,
  minutes_since_collection INTEGER,
  needs_collection BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as project_id,
    p.name,
    p.latitude,
    p.longitude,
    COALESCE(p.weather_collection_frequency, 30) as frequency,
    p.weather_last_collected_at as last_collected,
    CASE 
      WHEN p.weather_last_collected_at IS NULL THEN 999999
      ELSE EXTRACT(EPOCH FROM (NOW() - p.weather_last_collected_at))::INTEGER / 60
    END as minutes_since_collection,
    CASE 
      WHEN p.weather_last_collected_at IS NULL THEN true
      ELSE EXTRACT(EPOCH FROM (NOW() - p.weather_last_collected_at)) / 60 >= COALESCE(p.weather_collection_frequency, 30)
    END as needs_collection
  FROM projects p
  WHERE p.active = true
    AND p.weather_collection_enabled = true
    AND p.latitude IS NOT NULL
    AND p.longitude IS NOT NULL
  ORDER BY needs_collection DESC, p.name;
END;
$$ LANGUAGE plpgsql;

-- Create function to batch projects by grid location
-- This helps n8n optimize API calls for projects in same area
CREATE OR REPLACE FUNCTION get_projects_by_grid()
RETURNS TABLE (
  grid_id VARCHAR,
  grid_x INTEGER,
  grid_y INTEGER,
  project_count INTEGER,
  project_ids UUID[],
  latitude FLOAT,
  longitude FLOAT
) AS $$
BEGIN
  RETURN QUERY
  WITH project_grids AS (
    SELECT 
      p.id,
      p.latitude,
      p.longitude,
      COALESCE(
        -- Use cached grid if available
        p.cached_grid_id,
        -- Otherwise estimate grid (this is approximate, n8n will get exact)
        CASE 
          WHEN p.latitude BETWEEN 31 AND 35 AND p.longitude BETWEEN -100 AND -94 THEN 'FWD'
          WHEN p.latitude BETWEEN 28 AND 31 AND p.longitude BETWEEN -100 AND -94 THEN 'HGX'
          ELSE 'UNK'
        END
      ) as grid_id,
      p.cached_grid_x as grid_x,
      p.cached_grid_y as grid_y
    FROM projects p
    WHERE p.active = true
      AND p.weather_collection_enabled = true
      AND p.latitude IS NOT NULL
      AND p.longitude IS NOT NULL
      AND (
        p.weather_last_collected_at IS NULL OR
        EXTRACT(EPOCH FROM (NOW() - p.weather_last_collected_at)) / 60 >= COALESCE(p.weather_collection_frequency, 30)
      )
  )
  SELECT 
    pg.grid_id::VARCHAR,
    MIN(pg.grid_x)::INTEGER,
    MIN(pg.grid_y)::INTEGER,
    COUNT(*)::INTEGER as project_count,
    ARRAY_AGG(pg.id) as project_ids,
    AVG(pg.latitude)::FLOAT as latitude,
    AVG(pg.longitude)::FLOAT as longitude
  FROM project_grids pg
  GROUP BY pg.grid_id
  ORDER BY project_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Add cached grid columns if they don't exist
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cached_grid_id VARCHAR(10);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cached_grid_x INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cached_grid_y INTEGER;

-- Create index for grid lookups
CREATE INDEX IF NOT EXISTS idx_projects_grid ON projects(cached_grid_id, cached_grid_x, cached_grid_y) 
  WHERE active = true AND weather_collection_enabled = true;

-- Create index for weather collection queries
CREATE INDEX IF NOT EXISTS idx_projects_weather_collection ON projects(active, weather_collection_enabled, weather_last_collected_at) 
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Comments for documentation
COMMENT ON FUNCTION notify_project_weather_change() IS 'Sends PostgreSQL notifications when project weather collection status changes';
COMMENT ON FUNCTION get_active_weather_projects() IS 'Returns all projects that have weather collection enabled with their collection status';
COMMENT ON FUNCTION get_projects_by_grid() IS 'Groups projects by weather grid to optimize NOAA API calls';
COMMENT ON COLUMN projects.cached_grid_id IS 'NOAA weather grid ID (e.g., FWD for Fort Worth)';
COMMENT ON COLUMN projects.cached_grid_x IS 'NOAA grid X coordinate';
COMMENT ON COLUMN projects.cached_grid_y IS 'NOAA grid Y coordinate';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_active_weather_projects() TO authenticated;
GRANT EXECUTE ON FUNCTION get_projects_by_grid() TO authenticated;