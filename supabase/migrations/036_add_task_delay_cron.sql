-- Add cron job for daily task delay evaluation

-- Create cron log table if it doesn't exist
CREATE TABLE IF NOT EXISTS cron_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name VARCHAR(255) NOT NULL,
  execution_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(50) NOT NULL, -- 'success', 'error'
  summary JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for querying logs
CREATE INDEX idx_cron_logs_function_time ON cron_logs(function_name, execution_time DESC);

-- Function for scheduled task delay evaluation
-- This will be called by pg_cron daily
CREATE OR REPLACE FUNCTION scheduled_task_delay_evaluation()
RETURNS void AS $$
DECLARE
  project RECORD;
  evaluation_count INTEGER := 0;
  tasks_delayed INTEGER := 0;
  tasks_at_risk INTEGER := 0;
  start_time TIMESTAMPTZ;
  end_time TIMESTAMPTZ;
BEGIN
  start_time := clock_timestamp();
  
  -- Loop through all active projects
  FOR project IN 
    SELECT id, name
    FROM projects
    WHERE status = 'active'
  LOOP
    -- Evaluate all tasks for this project
    PERFORM evaluate_all_project_task_delays(project.id);
    evaluation_count := evaluation_count + 1;
  END LOOP;
  
  -- Count delayed and at-risk tasks
  SELECT 
    COUNT(*) FILTER (WHERE status = 'delayed'),
    COUNT(*) FILTER (WHERE status = 'at_risk')
  INTO tasks_delayed, tasks_at_risk
  FROM project_tasks
  WHERE project_id IN (SELECT id FROM projects WHERE status = 'active');
  
  end_time := clock_timestamp();
  
  -- Log the execution
  INSERT INTO cron_logs (
    function_name,
    execution_time,
    status,
    summary
  ) VALUES (
    'scheduled_task_delay_evaluation',
    start_time,
    'success',
    jsonb_build_object(
      'projects_evaluated', evaluation_count,
      'tasks_delayed', tasks_delayed,
      'tasks_at_risk', tasks_at_risk,
      'execution_duration_ms', EXTRACT(MILLISECOND FROM (end_time - start_time))
    )
  );
  
  RAISE NOTICE 'Task delay evaluation completed. Projects: %, Delayed: %, At Risk: %', 
    evaluation_count, tasks_delayed, tasks_at_risk;
    
EXCEPTION WHEN OTHERS THEN
  -- Log error
  INSERT INTO cron_logs (
    function_name,
    execution_time,
    status,
    error_message
  ) VALUES (
    'scheduled_task_delay_evaluation',
    start_time,
    'error',
    SQLERRM
  );
  
  RAISE;
END;
$$ LANGUAGE plpgsql;

-- Function to manually trigger delay evaluation for a single project
CREATE OR REPLACE FUNCTION trigger_project_task_evaluation(project_id UUID)
RETURNS JSONB AS $$
DECLARE
  task_count INTEGER;
  delayed_count INTEGER;
  at_risk_count INTEGER;
  forecast_risk_count INTEGER;
BEGIN
  -- Run evaluation
  PERFORM evaluate_all_project_task_delays(project_id);
  
  -- Get summary
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'delayed'),
    COUNT(*) FILTER (WHERE status = 'at_risk'),
    COUNT(*) FILTER (WHERE forecast_delay_risk = true)
  INTO task_count, delayed_count, at_risk_count, forecast_risk_count
  FROM project_tasks
  WHERE project_tasks.project_id = trigger_project_task_evaluation.project_id;
  
  RETURN jsonb_build_object(
    'project_id', project_id,
    'evaluated_at', NOW(),
    'total_tasks', task_count,
    'delayed_tasks', delayed_count,
    'at_risk_tasks', at_risk_count,
    'forecast_risk_tasks', forecast_risk_count
  );
END;
$$ LANGUAGE plpgsql;

-- Schedule the task delay evaluation to run daily at 6 AM
-- This checks all tasks against current weather and forecast
SELECT cron.schedule(
  'evaluate-task-delays-daily',
  '0 6 * * *',  -- 6 AM daily
  $$SELECT scheduled_task_delay_evaluation();$$
);

-- Also schedule a more frequent check during business hours (every 2 hours)
-- This is useful for real-time delay tracking during active work days
SELECT cron.schedule(
  'evaluate-task-delays-business-hours',
  '0 8-18/2 * * 1-5',  -- Every 2 hours from 8 AM to 6 PM on weekdays
  $$SELECT scheduled_task_delay_evaluation();$$
);

-- Function to get recent evaluation history
CREATE OR REPLACE FUNCTION get_task_evaluation_history(
  days_back INTEGER DEFAULT 7
) RETURNS TABLE (
  execution_time TIMESTAMPTZ,
  projects_evaluated INTEGER,
  tasks_delayed INTEGER,
  tasks_at_risk INTEGER,
  duration_ms INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cl.execution_time,
    (cl.summary->>'projects_evaluated')::INTEGER,
    (cl.summary->>'tasks_delayed')::INTEGER,
    (cl.summary->>'tasks_at_risk')::INTEGER,
    (cl.summary->>'execution_duration_ms')::INTEGER
  FROM cron_logs cl
  WHERE cl.function_name = 'scheduled_task_delay_evaluation'
    AND cl.status = 'success'
    AND cl.execution_time > NOW() - (days_back || ' days')::INTERVAL
  ORDER BY cl.execution_time DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION scheduled_task_delay_evaluation() TO postgres;
GRANT EXECUTE ON FUNCTION trigger_project_task_evaluation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_task_evaluation_history(INTEGER) TO authenticated;
GRANT SELECT ON cron_logs TO authenticated;

-- Enable RLS on cron_logs
ALTER TABLE cron_logs ENABLE ROW LEVEL SECURITY;

-- Policy for viewing cron logs (company users only)
CREATE POLICY "Company users can view cron logs" ON cron_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND company_id IS NOT NULL
    )
  );

-- Comments
COMMENT ON FUNCTION scheduled_task_delay_evaluation() IS 'Evaluates all active project tasks for delays based on weather and schedule';
COMMENT ON FUNCTION trigger_project_task_evaluation(UUID) IS 'Manually trigger delay evaluation for a specific project';
COMMENT ON FUNCTION get_task_evaluation_history(INTEGER) IS 'Get recent task evaluation history from cron logs';
COMMENT ON TABLE cron_logs IS 'Logs for scheduled function executions';