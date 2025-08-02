-- Drop obsolete tables that have been replaced by task-based architecture

-- Drop views that depend on obsolete tables first
DROP VIEW IF EXISTS analytics_overview CASCADE;
DROP VIEW IF EXISTS project_crew_equipment_costs CASCADE;
DROP VIEW IF EXISTS project_weather_impact CASCADE;

-- Drop obsolete weather_readings table (replaced by project_weather)
DROP TABLE IF EXISTS weather_readings CASCADE;

-- Drop obsolete delay_events table (replaced by task_daily_logs)
DROP TABLE IF EXISTS delay_events CASCADE;

-- Drop obsolete project-level crew/equipment tables (replaced by task-level)
DROP TABLE IF EXISTS project_crew CASCADE;
DROP TABLE IF EXISTS project_equipment CASCADE;

-- Drop obsolete project crew/equipment assignment tables
DROP TABLE IF EXISTS project_crew_assignments CASCADE;
DROP TABLE IF EXISTS project_equipment_assignments CASCADE;

-- Drop any functions that reference obsolete tables
DROP FUNCTION IF EXISTS update_project_weather_sensitivity CASCADE;
DROP FUNCTION IF EXISTS check_weather_delays CASCADE;

-- Remove obsolete columns from projects table if they still exist
ALTER TABLE projects 
  DROP COLUMN IF EXISTS weather_thresholds,
  DROP COLUMN IF EXISTS weather_collection_enabled,
  DROP COLUMN IF EXISTS weather_sensitivity_wind,
  DROP COLUMN IF EXISTS weather_sensitivity_rain,
  DROP COLUMN IF EXISTS weather_sensitivity_temp_min,
  DROP COLUMN IF EXISTS weather_sensitivity_temp_max,
  DROP COLUMN IF EXISTS weather_collection_interval,
  DROP COLUMN IF EXISTS last_weather_check,
  DROP COLUMN IF EXISTS assigned_crew,
  DROP COLUMN IF EXISTS assigned_equipment;

-- Clean up any obsolete RLS policies
DROP POLICY IF EXISTS "Users can view their company's weather readings" ON weather_readings;
DROP POLICY IF EXISTS "Users can view their company's delay events" ON delay_events;
DROP POLICY IF EXISTS "Users can manage their company's weather readings" ON weather_readings;
DROP POLICY IF EXISTS "Users can manage their company's delay events" ON delay_events;

-- Add comment documenting the migration
COMMENT ON SCHEMA public IS 'Migrated to task-based architecture. Obsolete tables removed: weather_readings, delay_events, project_crew, project_equipment';