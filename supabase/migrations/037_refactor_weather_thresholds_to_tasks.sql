-- Refactor weather thresholds from projects to tasks only

-- First, backup existing project thresholds to apply to tasks
CREATE TEMP TABLE project_threshold_backup AS
SELECT id, weather_thresholds
FROM projects
WHERE weather_thresholds IS NOT NULL;

-- Remove weather-specific columns from projects table
ALTER TABLE projects 
  DROP COLUMN IF EXISTS weather_thresholds,
  DROP COLUMN IF EXISTS weather_collection_enabled,
  DROP COLUMN IF EXISTS weather_collection_frequency,
  DROP COLUMN IF EXISTS weather_last_collected_at,
  DROP COLUMN IF EXISTS weather_alert_enabled,
  DROP COLUMN IF EXISTS weather_alert_threshold_hours;

-- Projects should just have basic info
COMMENT ON TABLE projects IS 'Projects represent construction jobs with basic information. Weather sensitivity is handled at task level.';

-- Update existing tasks to inherit thresholds from their projects
UPDATE project_tasks pt
SET weather_thresholds = p.weather_thresholds
FROM project_threshold_backup p
WHERE pt.project_id = p.id
  AND pt.weather_sensitive = true
  AND pt.weather_thresholds IS NULL;

-- Drop the temp table
DROP TABLE project_threshold_backup;

-- Now let's properly seed task data for existing projects
DO $$
DECLARE
  project_record RECORD;
  task_record RECORD;
  template_record RECORD;
  task_id UUID;
BEGIN
  -- First, delete existing tasks to start fresh
  DELETE FROM task_daily_logs;
  DELETE FROM task_crew_assignments;
  DELETE FROM task_equipment_assignments;
  DELETE FROM project_tasks;
  
  -- Reset task templates with proper weather thresholds
  DELETE FROM task_templates;
  
  -- Insert Flat Roofing templates
  INSERT INTO task_templates (project_type, task_name, task_type, sequence_order, typical_duration_days, weather_sensitive, weather_thresholds, typical_crew_size) VALUES
  ('Flat Roofing', 'Project Mobilization', 'mobilization', 1, 1, false, NULL, 4),
  ('Flat Roofing', 'Site Preparation & Safety Setup', 'site_prep', 2, 1, true, '{"wind_speed": 25, "precipitation": 0.1}'::jsonb, 4),
  ('Flat Roofing', 'Existing Roof Tear-Off', 'tear_off', 3, 3, true, '{"wind_speed": 20, "precipitation": 0.05}'::jsonb, 6),
  ('Flat Roofing', 'Deck Inspection & Repair', 'deck_repair', 4, 2, true, '{"wind_speed": 25, "precipitation": 0.1}'::jsonb, 4),
  ('Flat Roofing', 'Insulation Installation', 'insulation', 5, 2, true, '{"wind_speed": 15, "precipitation": 0, "humidity_max": 85}'::jsonb, 4),
  ('Flat Roofing', 'Membrane Installation', 'membrane_install', 6, 3, true, '{"wind_speed": 10, "precipitation": 0, "temperature_min": 40, "humidity_max": 85}'::jsonb, 6),
  ('Flat Roofing', 'Flashing & Detail Work', 'flashing', 7, 2, true, '{"wind_speed": 15, "precipitation": 0, "temperature_min": 35}'::jsonb, 4),
  ('Flat Roofing', 'Final Inspection & Cleanup', 'inspection', 8, 1, false, NULL, 4);

  -- Insert Framing templates
  INSERT INTO task_templates (project_type, task_name, task_type, sequence_order, typical_duration_days, weather_sensitive, weather_thresholds, typical_crew_size) VALUES
  ('Framing', 'Site Mobilization', 'mobilization', 1, 1, false, NULL, 6),
  ('Framing', 'Foundation Preparation', 'site_prep', 2, 2, true, '{"precipitation": 0.1}'::jsonb, 4),
  ('Framing', 'First Floor Framing', 'framing', 3, 5, true, '{"wind_speed": 25, "precipitation": 0.1, "temperature_min": 20}'::jsonb, 8),
  ('Framing', 'Second Floor Framing', 'framing', 4, 5, true, '{"wind_speed": 20, "precipitation": 0.1, "temperature_min": 20}'::jsonb, 8),
  ('Framing', 'Roof Structure Framing', 'framing', 5, 4, true, '{"wind_speed": 15, "precipitation": 0.05, "temperature_min": 25}'::jsonb, 6),
  ('Framing', 'Sheathing Installation', 'sealing', 6, 3, true, '{"wind_speed": 20, "precipitation": 0.05}'::jsonb, 6),
  ('Framing', 'Inspection & Punch List', 'inspection', 7, 1, false, NULL, 4);

  -- Insert Concrete Pour templates
  INSERT INTO task_templates (project_type, task_name, task_type, sequence_order, typical_duration_days, weather_sensitive, weather_thresholds, typical_crew_size) VALUES
  ('Concrete Pour', 'Site Setup & Access', 'mobilization', 1, 1, false, NULL, 4),
  ('Concrete Pour', 'Excavation & Grading', 'excavation', 2, 3, true, '{"precipitation": 0.2}'::jsonb, 6),
  ('Concrete Pour', 'Formwork Installation', 'forming', 3, 3, true, '{"wind_speed": 30, "precipitation": 0.1}'::jsonb, 6),
  ('Concrete Pour', 'Rebar Installation', 'rebar_install', 4, 2, true, '{"precipitation": 0.1}'::jsonb, 4),
  ('Concrete Pour', 'Concrete Pour', 'concrete_pour', 5, 1, true, '{"precipitation": 0, "temperature_min": 35, "temperature_max": 90, "wind_speed": 25}'::jsonb, 8),
  ('Concrete Pour', 'Concrete Finishing', 'concrete_finish', 6, 2, true, '{"precipitation": 0, "temperature_min": 40, "temperature_max": 85, "humidity_max": 90}'::jsonb, 4),
  ('Concrete Pour', 'Curing & Protection', 'sealing', 7, 7, true, '{"temperature_min": 35, "temperature_max": 95}'::jsonb, 2),
  ('Concrete Pour', 'Form Removal & Cleanup', 'cleanup', 8, 2, false, NULL, 4);

  -- Now generate tasks for each active project
  FOR project_record IN 
    SELECT p.*, c.id as company_id
    FROM projects p
    JOIN companies c ON p.company_id = c.id
    WHERE p.active = true
  LOOP
    -- Skip if project already has tasks
    IF EXISTS (SELECT 1 FROM project_tasks WHERE project_id = project_record.id) THEN
      CONTINUE;
    END IF;
    
    -- Get templates for this project type
    FOR template_record IN 
      SELECT * FROM task_templates 
      WHERE project_type = project_record.project_type
      ORDER BY sequence_order
    LOOP
      -- Create the task
      INSERT INTO project_tasks (
        project_id,
        name,
        type,
        sequence_order,
        expected_duration_days,
        weather_sensitive,
        weather_thresholds,
        status,
        progress_percentage,
        crew_count,
        equipment_count,
        depends_on,
        blocks,
        created_by
      ) VALUES (
        project_record.id,
        template_record.task_name,
        template_record.task_type,
        template_record.sequence_order,
        template_record.typical_duration_days,
        template_record.weather_sensitive,
        template_record.weather_thresholds,
        CASE 
          WHEN template_record.sequence_order = 1 THEN 'in_progress'
          ELSE 'pending'
        END,
        CASE 
          WHEN template_record.sequence_order = 1 THEN 25
          ELSE 0
        END,
        template_record.typical_crew_size,
        CASE template_record.task_type
          WHEN 'excavation' THEN 3
          WHEN 'concrete_pour' THEN 2
          WHEN 'forming' THEN 1
          ELSE 0
        END,
        '{}',
        '{}',
        project_record.user_id
      ) RETURNING id INTO task_id;
      
      -- Set expected dates based on project start date
      UPDATE project_tasks 
      SET 
        expected_start = project_record.start_date + ((template_record.sequence_order - 1) * 7 || ' days')::interval,
        expected_end = project_record.start_date + ((template_record.sequence_order - 1) * 7 + template_record.typical_duration_days || ' days')::interval
      WHERE id = task_id;
      
      -- For first task, set actual start
      IF template_record.sequence_order = 1 THEN
        UPDATE project_tasks 
        SET actual_start = project_record.start_date
        WHERE id = task_id;
      END IF;
    END LOOP;
  END LOOP;
  
  -- Add some sample task assignments for variety
  -- Add crew assignments to some tasks
  INSERT INTO task_crew_assignments (task_id, crew_member_id, assigned_date, status, role)
  SELECT 
    pt.id,
    cm.id,
    pt.expected_start::date,
    'assigned',
    CASE 
      WHEN ROW_NUMBER() OVER (PARTITION BY pt.id ORDER BY cm.id) = 1 THEN 'lead'
      ELSE 'helper'
    END
  FROM project_tasks pt
  CROSS JOIN LATERAL (
    SELECT cm.* 
    FROM crew_members cm
    WHERE cm.company_id = (SELECT company_id FROM projects WHERE id = pt.project_id)
    AND cm.active = true
    ORDER BY RANDOM()
    LIMIT CASE 
      WHEN pt.crew_count > 0 THEN LEAST(pt.crew_count, 2)
      ELSE 0
    END
  ) cm
  WHERE pt.status IN ('in_progress', 'on_track');
  
  -- Add some outsourced crew assignments
  INSERT INTO task_crew_assignments (
    task_id, 
    is_outsourced,
    outsource_company_name,
    outsource_crew_size,
    outsource_contact_name,
    outsource_contact_phone,
    outsource_rate_type,
    outsource_rate,
    assigned_date,
    status
  )
  SELECT 
    pt.id,
    true,
    CASE pt.type
      WHEN 'concrete_pour' THEN 'ABC Concrete Specialists'
      WHEN 'rebar_install' THEN 'Steel Works Inc'
      WHEN 'excavation' THEN 'Earth Movers LLC'
      ELSE 'General Contractors Inc'
    END,
    CASE pt.type
      WHEN 'concrete_pour' THEN 6
      WHEN 'excavation' THEN 4
      ELSE 3
    END,
    'John Smith',
    '555-0100',
    'daily',
    CASE pt.type
      WHEN 'concrete_pour' THEN 3200
      WHEN 'excavation' THEN 2800
      ELSE 2000
    END,
    pt.expected_start::date,
    'assigned'
  FROM project_tasks pt
  WHERE pt.type IN ('concrete_pour', 'rebar_install', 'excavation')
  AND pt.status != 'completed'
  LIMIT 5;
  
  -- Add equipment assignments
  INSERT INTO task_equipment_assignments (task_id, equipment_id, assigned_date, status, quantity)
  SELECT 
    pt.id,
    e.id,
    pt.expected_start::date,
    'assigned',
    1
  FROM project_tasks pt
  CROSS JOIN LATERAL (
    SELECT e.* 
    FROM equipment e
    WHERE e.company_id = (SELECT company_id FROM projects WHERE id = pt.project_id)
    AND e.active = true
    AND (
      (pt.type = 'excavation' AND e.type = 'Excavator') OR
      (pt.type = 'concrete_pour' AND e.type IN ('Concrete Mixer', 'Concrete Pump')) OR
      (pt.type = 'forming' AND e.type = 'Generator')
    )
    ORDER BY RANDOM()
    LIMIT 1
  ) e
  WHERE pt.equipment_count > 0;
  
  -- Add some rented equipment
  INSERT INTO task_equipment_assignments (
    task_id,
    is_rented,
    rental_company_name,
    rental_equipment_type,
    rental_rate_type,
    rental_rate,
    rental_start_date,
    rental_end_date,
    assigned_date,
    status,
    quantity
  )
  SELECT 
    pt.id,
    true,
    'United Rentals',
    CASE pt.type
      WHEN 'membrane_install' THEN 'Roofing Torch'
      WHEN 'tear_off' THEN 'Debris Container'
      WHEN 'site_prep' THEN 'Safety Barriers'
      ELSE 'Scissor Lift'
    END,
    'daily',
    CASE pt.type
      WHEN 'membrane_install' THEN 150
      WHEN 'tear_off' THEN 300
      ELSE 200
    END,
    pt.expected_start::date,
    pt.expected_end::date,
    pt.expected_start::date,
    'assigned',
    CASE pt.type
      WHEN 'site_prep' THEN 10
      ELSE 1
    END
  FROM project_tasks pt
  WHERE pt.type IN ('membrane_install', 'tear_off', 'site_prep')
  AND NOT EXISTS (
    SELECT 1 FROM task_equipment_assignments 
    WHERE task_id = pt.id
  )
  LIMIT 6;
  
  -- Update task delay status for some tasks
  UPDATE project_tasks
  SET 
    status = 'delayed',
    delayed_today = true,
    delay_days = 2,
    delay_reason = 'High winds exceeding safety threshold',
    total_delay_days = 2
  WHERE type IN ('membrane_install', 'roofing', 'framing')
  AND weather_sensitive = true
  AND status = 'in_progress'
  AND RANDOM() < 0.3;
  
  -- Set some tasks at risk
  UPDATE project_tasks
  SET 
    status = 'at_risk',
    forecast_delay_risk = true,
    delay_reason = 'Weather forecast shows conditions exceeding thresholds'
  WHERE weather_sensitive = true
  AND status IN ('pending', 'in_progress')
  AND type IN ('concrete_pour', 'membrane_install')
  AND RANDOM() < 0.4;
  
  -- Create some daily logs
  INSERT INTO task_daily_logs (
    task_id,
    log_date,
    delayed,
    delay_reason,
    delay_category,
    weather_snapshot,
    hours_worked,
    progress_made,
    notes
  )
  SELECT 
    id,
    CURRENT_DATE,
    true,
    delay_reason,
    'weather',
    '{"temperature": 45, "wind_speed": 28, "conditions": "Windy"}'::jsonb,
    0,
    0,
    'Work stopped due to weather conditions'
  FROM project_tasks
  WHERE delayed_today = true;
  
END $$;

-- Update crew and equipment counts on tasks
UPDATE project_tasks pt
SET crew_count = (
  SELECT COUNT(*) FROM task_crew_assignments 
  WHERE task_id = pt.id
);

UPDATE project_tasks pt
SET equipment_count = (
  SELECT COUNT(*) FROM task_equipment_assignments 
  WHERE task_id = pt.id
);

-- Create a function to check weather for all tasks in a project
CREATE OR REPLACE FUNCTION check_project_tasks_weather(
  project_id UUID
) RETURNS TABLE (
  task_id UUID,
  task_name VARCHAR,
  weather_sensitive BOOLEAN,
  exceeds_threshold BOOLEAN,
  threshold_details JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_weather AS (
    SELECT * FROM project_weather
    WHERE project_weather.project_id = check_project_tasks_weather.project_id
    AND data_source = 'observation'
    ORDER BY collected_at DESC
    LIMIT 1
  )
  SELECT 
    pt.id,
    pt.name,
    pt.weather_sensitive,
    CASE 
      WHEN pt.weather_sensitive AND pt.weather_thresholds IS NOT NULL THEN
        (pt.weather_thresholds->>'wind_speed' IS NOT NULL AND 
         lw.wind_speed > (pt.weather_thresholds->>'wind_speed')::numeric) OR
        (pt.weather_thresholds->>'precipitation' IS NOT NULL AND 
         lw.precipitation_amount > (pt.weather_thresholds->>'precipitation')::numeric) OR
        (pt.weather_thresholds->>'temperature_min' IS NOT NULL AND 
         lw.temperature < (pt.weather_thresholds->>'temperature_min')::numeric) OR
        (pt.weather_thresholds->>'temperature_max' IS NOT NULL AND 
         lw.temperature > (pt.weather_thresholds->>'temperature_max')::numeric)
      ELSE false
    END as exceeds_threshold,
    CASE 
      WHEN pt.weather_sensitive THEN
        jsonb_build_object(
          'thresholds', pt.weather_thresholds,
          'current_weather', jsonb_build_object(
            'wind_speed', lw.wind_speed,
            'precipitation', lw.precipitation_amount,
            'temperature', lw.temperature
          )
        )
      ELSE NULL
    END as threshold_details
  FROM project_tasks pt
  CROSS JOIN latest_weather lw
  WHERE pt.project_id = check_project_tasks_weather.project_id
  AND pt.status NOT IN ('completed', 'cancelled');
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_project_tasks_weather TO authenticated;

-- Update comments
COMMENT ON COLUMN project_tasks.weather_thresholds IS 'Task-specific weather thresholds that determine work stoppage';
COMMENT ON FUNCTION check_project_tasks_weather IS 'Checks all active tasks in a project against current weather conditions';