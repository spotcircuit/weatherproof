-- Add intelligent delay evaluation and forecast risk awareness to tasks

-- Create delay category type if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delay_category') THEN
    CREATE TYPE delay_category AS ENUM ('weather', 'equipment', 'crew', 'material', 'other');
  END IF;
END $$;

-- First, add new columns to project_tasks
ALTER TABLE project_tasks 
  ADD COLUMN IF NOT EXISTS forecast_delay_risk BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS delay_days INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completion_variance_pct DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS blocking_task_id UUID REFERENCES project_tasks(id),
  ADD COLUMN IF NOT EXISTS last_delay_evaluation TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cost_impact DECIMAL(12,2);

-- Update status enum to include more granular states
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status_extended') THEN
    CREATE TYPE task_status_extended AS ENUM (
      'pending', 
      'in_progress', 
      'on_track',
      'at_risk',
      'delayed',
      'completed', 
      'cancelled'
    );
  END IF;
END $$;

-- Drop views that depend on the status column
DROP VIEW IF EXISTS task_resource_summary CASCADE;
DROP VIEW IF EXISTS task_delays_summary CASCADE;

-- First drop the default constraint
ALTER TABLE project_tasks 
  ALTER COLUMN status DROP DEFAULT;

-- Migrate existing status values to varchar temporarily
ALTER TABLE project_tasks 
  ALTER COLUMN status TYPE VARCHAR(50);

-- Update existing values to map to new enum values
UPDATE project_tasks 
SET status = CASE 
  WHEN status = 'in_progress' AND delayed_today = true THEN 'delayed'
  WHEN status = 'in_progress' AND delayed_today = false THEN 'on_track'
  ELSE status
END;

-- Now change to the new enum type
ALTER TABLE project_tasks 
  ALTER COLUMN status TYPE task_status_extended 
  USING status::task_status_extended;

-- Set new default
ALTER TABLE project_tasks 
  ALTER COLUMN status SET DEFAULT 'pending'::task_status_extended;

-- Recreate the task_resource_summary view with new status type
CREATE OR REPLACE VIEW task_resource_summary AS
SELECT 
  pt.id as task_id,
  pt.name as task_name,
  pt.type as task_type,
  pt.status as task_status,
  p.name as project_name,
  
  -- Crew counts
  COUNT(DISTINCT tca.id) as total_crew_assignments,
  COUNT(DISTINCT tca.id) FILTER (WHERE tca.is_outsourced = false) as internal_crew_count,
  COUNT(DISTINCT tca.id) FILTER (WHERE tca.is_outsourced = true) as outsourced_crew_count,
  SUM(CASE WHEN tca.is_outsourced THEN tca.outsource_crew_size ELSE 1 END) as total_crew_size,
  
  -- Equipment counts
  COUNT(DISTINCT tea.id) as total_equipment_assignments,
  COUNT(DISTINCT tea.id) FILTER (WHERE tea.is_rented = false) as owned_equipment_count,
  COUNT(DISTINCT tea.id) FILTER (WHERE tea.is_rented = true) as rented_equipment_count,
  
  -- Costs
  SUM(CASE 
    WHEN tca.is_outsourced AND tca.outsource_rate_type = 'daily' THEN tca.outsource_rate
    WHEN tca.is_outsourced AND tca.outsource_rate_type = 'hourly' THEN tca.outsource_rate * 8
    ELSE 0 
  END) as estimated_daily_crew_cost,
  
  SUM(CASE 
    WHEN tea.is_rented AND tea.rental_rate_type = 'daily' THEN tea.rental_rate * tea.quantity
    WHEN tea.is_rented AND tea.rental_rate_type = 'hourly' THEN tea.rental_rate * 8 * tea.quantity
    ELSE 0 
  END) as estimated_daily_equipment_cost

FROM project_tasks pt
JOIN projects p ON pt.project_id = p.id
LEFT JOIN task_crew_assignments tca ON pt.id = tca.task_id
LEFT JOIN task_equipment_assignments tea ON pt.id = tea.task_id
GROUP BY pt.id, pt.name, pt.type, pt.status, p.name;

-- Grant access to the recreated view
GRANT SELECT ON task_resource_summary TO authenticated;

-- Create table for subcontractor updates (secure link submissions)
CREATE TABLE subcontractor_task_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  update_token UUID DEFAULT gen_random_uuid(), -- Secure token for link
  
  -- Update details
  progress_percentage INTEGER CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  status_update task_status_extended,
  delay_reason TEXT,
  delay_category delay_category,
  crew_size_present INTEGER,
  hours_worked DECIMAL(5,2),
  
  -- Evidence
  notes TEXT,
  photos TEXT[], -- Array of photo URLs
  weather_conditions TEXT,
  
  -- Metadata
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_by_name VARCHAR(255),
  submitted_by_phone VARCHAR(50),
  ip_address INET,
  is_processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  
  -- Expiry for security
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Create function to calculate delay days
CREATE OR REPLACE FUNCTION calculate_task_delay_days(
  expected_start DATE,
  expected_end DATE,
  actual_start DATE,
  actual_end DATE,
  current_status task_status_extended
) RETURNS INTEGER AS $$
DECLARE
  delay_days INTEGER := 0;
  current_date DATE := CURRENT_DATE;
BEGIN
  -- If task hasn't started yet
  IF actual_start IS NULL AND expected_start < current_date THEN
    delay_days := current_date - expected_start;
  
  -- If task has started but not ended
  ELSIF actual_start IS NOT NULL AND actual_end IS NULL THEN
    IF expected_end < current_date THEN
      delay_days := current_date - expected_end;
    END IF;
  
  -- If task is completed
  ELSIF actual_end IS NOT NULL AND expected_end IS NOT NULL THEN
    delay_days := actual_end - expected_end;
  END IF;
  
  -- Return 0 if negative (ahead of schedule)
  RETURN GREATEST(delay_days, 0);
END;
$$ LANGUAGE plpgsql;

-- Create function to evaluate task status based on delays and timeline
CREATE OR REPLACE FUNCTION evaluate_task_status(
  task_id UUID
) RETURNS task_status_extended AS $$
DECLARE
  task_record RECORD;
  delay_days INTEGER;
  new_status task_status_extended;
  total_duration INTEGER;
  elapsed_pct DECIMAL;
  expected_progress DECIMAL;
BEGIN
  SELECT * INTO task_record FROM project_tasks WHERE id = task_id;
  
  -- If already completed or cancelled, keep status
  IF task_record.status IN ('completed', 'cancelled') THEN
    RETURN task_record.status;
  END IF;
  
  -- Calculate delay days
  delay_days := calculate_task_delay_days(
    task_record.expected_start,
    task_record.expected_end,
    task_record.actual_start,
    task_record.actual_end,
    task_record.status
  );
  
  -- If task hasn't started
  IF task_record.actual_start IS NULL THEN
    IF task_record.expected_start > CURRENT_DATE THEN
      new_status := 'pending';
    ELSIF delay_days > 0 THEN
      new_status := 'delayed';
    ELSE
      new_status := 'pending';
    END IF;
  
  -- If task is in progress
  ELSE
    -- Calculate expected vs actual progress
    IF task_record.expected_end IS NOT NULL AND task_record.expected_start IS NOT NULL THEN
      total_duration := task_record.expected_end - task_record.expected_start;
      IF total_duration > 0 THEN
        elapsed_pct := (CURRENT_DATE - task_record.expected_start)::DECIMAL / total_duration * 100;
        expected_progress := LEAST(elapsed_pct, 100);
        
        -- Compare with actual progress
        IF task_record.progress_percentage >= expected_progress - 10 THEN
          new_status := 'on_track';
        ELSIF task_record.progress_percentage >= expected_progress - 25 THEN
          new_status := 'at_risk';
        ELSE
          new_status := 'delayed';
        END IF;
      ELSE
        new_status := 'in_progress';
      END IF;
    END IF;
    
    -- Override if significantly delayed
    IF delay_days > 3 THEN
      new_status := 'delayed';
    ELSIF delay_days > 1 AND new_status = 'on_track' THEN
      new_status := 'at_risk';
    END IF;
  END IF;
  
  -- Check if delayed by weather today
  IF task_record.delayed_today THEN
    IF new_status IN ('pending', 'on_track') THEN
      new_status := 'at_risk';
    END IF;
  END IF;
  
  RETURN new_status;
END;
$$ LANGUAGE plpgsql;

-- Create function to check forecast delay risk using existing project_weather table
CREATE OR REPLACE FUNCTION check_task_forecast_risk(
  task_id UUID,
  hours_ahead INTEGER DEFAULT 72
) RETURNS BOOLEAN AS $$
DECLARE
  task_record RECORD;
  weather_forecast RECORD;
  has_risk BOOLEAN := false;
BEGIN
  -- Get task with weather thresholds
  SELECT pt.*, p.id as project_id
  INTO task_record
  FROM project_tasks pt
  JOIN projects p ON pt.project_id = p.id
  WHERE pt.id = task_id;
  
  -- If task is not weather sensitive or already completed, no risk
  IF NOT task_record.weather_sensitive OR 
     task_record.status IN ('completed', 'cancelled') OR
     task_record.weather_thresholds IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check forecast weather data in project_weather table
  -- The data_source='forecast' indicates forecast data
  FOR weather_forecast IN 
    SELECT * FROM project_weather
    WHERE project_id = task_record.project_id
      AND collected_at > NOW()
      AND collected_at <= NOW() + (hours_ahead || ' hours')::INTERVAL
      AND data_source = 'forecast'
  LOOP
    -- Check each threshold
    IF (task_record.weather_thresholds->>'wind_speed')::NUMERIC IS NOT NULL AND
       weather_forecast.wind_speed > (task_record.weather_thresholds->>'wind_speed')::NUMERIC THEN
      has_risk := true;
    END IF;
    
    IF (task_record.weather_thresholds->>'precipitation')::NUMERIC IS NOT NULL AND
       weather_forecast.precipitation_amount > (task_record.weather_thresholds->>'precipitation')::NUMERIC THEN
      has_risk := true;
    END IF;
    
    IF (task_record.weather_thresholds->>'temperature_min')::NUMERIC IS NOT NULL AND
       weather_forecast.temperature < (task_record.weather_thresholds->>'temperature_min')::NUMERIC THEN
      has_risk := true;
    END IF;
    
    IF (task_record.weather_thresholds->>'temperature_max')::NUMERIC IS NOT NULL AND
       weather_forecast.temperature > (task_record.weather_thresholds->>'temperature_max')::NUMERIC THEN
      has_risk := true;
    END IF;
    
    -- Also check humidity and visibility if defined
    IF (task_record.weather_thresholds->>'humidity_max')::NUMERIC IS NOT NULL AND
       weather_forecast.humidity > (task_record.weather_thresholds->>'humidity_max')::NUMERIC THEN
      has_risk := true;
    END IF;
    
    IF (task_record.weather_thresholds->>'visibility_min')::NUMERIC IS NOT NULL AND
       weather_forecast.visibility < (task_record.weather_thresholds->>'visibility_min')::NUMERIC THEN
      has_risk := true;
    END IF;
    
    IF has_risk THEN
      EXIT; -- Stop checking once risk is found
    END IF;
  END LOOP;
  
  RETURN has_risk;
END;
$$ LANGUAGE plpgsql;

-- Create function to update all task delays for a project
CREATE OR REPLACE FUNCTION evaluate_all_project_task_delays(
  project_id UUID
) RETURNS VOID AS $$
DECLARE
  task_record RECORD;
  new_status task_status_extended;
  new_delay_days INTEGER;
  new_variance_pct DECIMAL;
  forecast_risk BOOLEAN;
BEGIN
  FOR task_record IN 
    SELECT * FROM project_tasks 
    WHERE project_tasks.project_id = evaluate_all_project_task_delays.project_id
    ORDER BY sequence_order
  LOOP
    -- Calculate delay days
    new_delay_days := calculate_task_delay_days(
      task_record.expected_start,
      task_record.expected_end,
      task_record.actual_start,
      task_record.actual_end,
      task_record.status
    );
    
    -- Evaluate status
    new_status := evaluate_task_status(task_record.id);
    
    -- Calculate completion variance
    IF task_record.expected_duration_days > 0 THEN
      new_variance_pct := (new_delay_days::DECIMAL / task_record.expected_duration_days) * 100;
    ELSE
      new_variance_pct := 0;
    END IF;
    
    -- Check forecast risk
    forecast_risk := check_task_forecast_risk(task_record.id);
    
    -- Update task
    UPDATE project_tasks
    SET 
      delay_days = new_delay_days,
      status = new_status,
      completion_variance_pct = new_variance_pct,
      forecast_delay_risk = forecast_risk,
      last_delay_evaluation = NOW()
    WHERE id = task_record.id;
    
    -- Handle blocking dependencies
    IF new_status = 'delayed' AND task_record.blocks IS NOT NULL THEN
      -- Mark dependent tasks as at risk
      UPDATE project_tasks
      SET status = 'at_risk'
      WHERE id = ANY(task_record.blocks)
        AND status NOT IN ('completed', 'cancelled', 'delayed');
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create view for task delay analytics
CREATE OR REPLACE VIEW task_delay_analytics AS
SELECT 
  pt.id as task_id,
  pt.name as task_name,
  pt.type as task_type,
  pt.status,
  pt.delay_days,
  pt.completion_variance_pct,
  pt.forecast_delay_risk,
  pt.weather_sensitive,
  pt.delayed_today,
  pt.total_delay_days,
  pt.delay_reason,
  pt.cost_impact,
  p.id as project_id,
  p.name as project_name,
  p.project_type,
  p.company_id,
  c.name as company_name,
  
  -- Crew information
  COUNT(DISTINCT tca.id) as total_crew_assignments,
  COUNT(DISTINCT tca.id) FILTER (WHERE tca.is_outsourced = true) as outsourced_crews,
  SUM(CASE WHEN tca.is_outsourced THEN tca.outsource_crew_size ELSE 1 END) as total_crew_size,
  
  -- Equipment information  
  COUNT(DISTINCT tea.id) as total_equipment_assignments,
  COUNT(DISTINCT tea.id) FILTER (WHERE tea.is_rented = true) as rented_equipment,
  
  -- Daily logs
  COUNT(DISTINCT tdl.id) as total_daily_logs,
  COUNT(DISTINCT tdl.id) FILTER (WHERE tdl.delayed = true) as delay_logs,
  
  -- Latest weather
  pw.temperature as latest_temperature,
  pw.wind_speed as latest_wind_speed,
  pw.precipitation_amount as latest_precipitation,
  pw.conditions as latest_conditions

FROM project_tasks pt
JOIN projects p ON pt.project_id = p.id
JOIN companies c ON p.company_id = c.id
LEFT JOIN task_crew_assignments tca ON pt.id = tca.task_id
LEFT JOIN task_equipment_assignments tea ON pt.id = tea.task_id
LEFT JOIN task_daily_logs tdl ON pt.id = tdl.task_id
LEFT JOIN LATERAL (
  SELECT * FROM project_weather
  WHERE project_id = p.id
    AND data_source = 'observation'
  ORDER BY collected_at DESC
  LIMIT 1
) pw ON true
GROUP BY 
  pt.id, pt.name, pt.type, pt.status, pt.delay_days, pt.completion_variance_pct,
  pt.forecast_delay_risk, pt.weather_sensitive, pt.delayed_today, pt.total_delay_days,
  pt.delay_reason, pt.cost_impact, p.id, p.name, p.project_type, p.company_id, 
  c.name, pw.temperature, pw.wind_speed, pw.precipitation_amount, pw.conditions;

-- Create indexes for performance
CREATE INDEX idx_project_tasks_forecast_risk ON project_tasks(forecast_delay_risk) WHERE forecast_delay_risk = true;
CREATE INDEX idx_project_tasks_blocking ON project_tasks(blocking_task_id);
CREATE INDEX idx_project_tasks_delay_eval ON project_tasks(last_delay_evaluation);
CREATE INDEX idx_subcontractor_updates_token ON subcontractor_task_updates(update_token);
CREATE INDEX idx_subcontractor_updates_processed ON subcontractor_task_updates(is_processed) WHERE is_processed = false;

-- Enable RLS on subcontractor updates
ALTER TABLE subcontractor_task_updates ENABLE ROW LEVEL SECURITY;

-- Policy for subcontractor updates (anyone with token can insert)
CREATE POLICY "Anyone with valid token can submit updates" ON subcontractor_task_updates
  FOR INSERT WITH CHECK (true);

-- Policy for viewing (only company users)
CREATE POLICY "Company users can view subcontractor updates" ON subcontractor_task_updates
  FOR SELECT USING (
    task_id IN (
      SELECT pt.id FROM project_tasks pt
      JOIN projects p ON pt.project_id = p.id
      WHERE p.company_id IN (
        SELECT company_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

-- Grant permissions
GRANT SELECT ON task_delay_analytics TO authenticated;
GRANT INSERT ON subcontractor_task_updates TO anon;
GRANT SELECT, UPDATE ON subcontractor_task_updates TO authenticated;

-- Comments
COMMENT ON COLUMN project_tasks.forecast_delay_risk IS 'True if weather forecast in next 72 hours exceeds thresholds';
COMMENT ON COLUMN project_tasks.delay_days IS 'Calculated days behind schedule';
COMMENT ON COLUMN project_tasks.completion_variance_pct IS 'Percentage variance from expected completion';
COMMENT ON COLUMN project_tasks.blocking_task_id IS 'Task that must complete before this one can start';
COMMENT ON COLUMN project_tasks.cost_impact IS 'Estimated financial impact of delays';
COMMENT ON TABLE subcontractor_task_updates IS 'Secure submissions from subcontractors without user accounts';