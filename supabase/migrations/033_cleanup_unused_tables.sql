-- Clean up unused tables and consolidate schema

-- Drop unused weather-related tables that are being replaced by project_weather
DROP TABLE IF EXISTS weather_readings CASCADE;
DROP TABLE IF EXISTS weather_stations CASCADE;
DROP TABLE IF EXISTS weather_forecasts CASCADE;

-- Drop old delay tracking tables if they exist (replaced by task-level tracking)
DROP TABLE IF EXISTS delay_events CASCADE;
DROP TABLE IF EXISTS delay_logs CASCADE;

-- Drop redundant assignment tables (now handled at task level)
DROP TABLE IF EXISTS project_crew_assignments CASCADE;
DROP TABLE IF EXISTS project_equipment_assignments CASCADE;

-- Update project type to use consistent naming
UPDATE projects 
SET project_type = CASE 
  WHEN LOWER(project_type) LIKE '%roof%' THEN 'Flat Roofing'
  WHEN LOWER(project_type) LIKE '%fram%' THEN 'Framing'
  WHEN LOWER(project_type) LIKE '%concrete%' THEN 'Concrete Pour'
  WHEN LOWER(project_type) LIKE '%foundation%' THEN 'Concrete Pour'
  ELSE project_type
END
WHERE project_type IS NOT NULL;

-- Add indexes for better performance on task queries
CREATE INDEX IF NOT EXISTS idx_project_tasks_expected_start ON project_tasks(expected_start);
CREATE INDEX IF NOT EXISTS idx_project_tasks_actual_start ON project_tasks(actual_start);
CREATE INDEX IF NOT EXISTS idx_task_daily_logs_delayed ON task_daily_logs(delayed) WHERE delayed = true;

-- Add a view for easy task delay reporting
CREATE OR REPLACE VIEW task_delays_summary AS
SELECT 
  p.id as project_id,
  p.name as project_name,
  p.company_id,
  pt.id as task_id,
  pt.name as task_name,
  pt.type as task_type,
  pt.expected_start,
  pt.expected_end,
  pt.actual_start,
  pt.actual_end,
  pt.delayed_today,
  pt.total_delay_days,
  pt.delay_reason,
  COUNT(tdl.id) as total_log_entries,
  COUNT(tdl.id) FILTER (WHERE tdl.delayed = true) as delay_log_entries,
  MAX(tdl.log_date) as last_log_date
FROM projects p
JOIN project_tasks pt ON p.id = pt.project_id
LEFT JOIN task_daily_logs tdl ON pt.id = tdl.task_id
GROUP BY p.id, p.name, p.company_id, pt.id, pt.name, pt.type, 
         pt.expected_start, pt.expected_end, pt.actual_start, 
         pt.actual_end, pt.delayed_today, pt.total_delay_days, pt.delay_reason;

-- Grant access to the view
GRANT SELECT ON task_delays_summary TO authenticated;

-- Add helpful comments
COMMENT ON VIEW task_delays_summary IS 'Summary view of task delays for reporting and analysis';

-- Create a function to calculate project completion percentage based on tasks
CREATE OR REPLACE FUNCTION calculate_project_completion(project_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_tasks INTEGER;
  completed_tasks INTEGER;
  completion_percentage INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_tasks
  FROM project_tasks
  WHERE project_tasks.project_id = calculate_project_completion.project_id;
  
  SELECT COUNT(*) INTO completed_tasks
  FROM project_tasks
  WHERE project_tasks.project_id = calculate_project_completion.project_id
  AND status = 'completed';
  
  IF total_tasks = 0 THEN
    RETURN 0;
  END IF;
  
  completion_percentage := ROUND((completed_tasks::DECIMAL / total_tasks) * 100);
  RETURN completion_percentage;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION calculate_project_completion TO authenticated;