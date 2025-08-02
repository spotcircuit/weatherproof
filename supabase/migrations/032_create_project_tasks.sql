-- Create project tasks system for granular delay tracking

-- Create task types enum
CREATE TYPE task_type AS ENUM (
  'mobilization',
  'site_prep',
  'demolition',
  'tear_off',
  'deck_repair',
  'underlayment',
  'insulation',
  'waterproofing',
  'torch_weld',
  'membrane_install',
  'flashing',
  'sealing',
  'inspection',
  'cleanup',
  'framing',
  'concrete_pour',
  'concrete_finish',
  'rebar_install',
  'forming',
  'excavation',
  'backfill',
  'grading'
);

-- Create project tasks table
CREATE TABLE project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Task details
  name VARCHAR(255) NOT NULL,
  type task_type NOT NULL,
  description TEXT,
  sequence_order INTEGER NOT NULL DEFAULT 0,
  
  -- Timing
  expected_start DATE,
  expected_end DATE,
  expected_duration_days INTEGER DEFAULT 1,
  actual_start DATE,
  actual_end DATE,
  
  -- Weather sensitivity
  weather_sensitive BOOLEAN DEFAULT true,
  weather_thresholds JSONB, -- Can override project thresholds
  -- Example: {"wind_speed": 20, "precipitation": 0.1, "temperature_min": 35}
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, delayed, cancelled
  delayed_today BOOLEAN DEFAULT false,
  delay_reason TEXT,
  total_delay_days INTEGER DEFAULT 0,
  
  -- Resource assignment (stores IDs from crew_members and equipment tables)
  assigned_crew UUID[], -- Array of crew member IDs
  assigned_equipment UUID[], -- Array of equipment IDs
  crew_count INTEGER DEFAULT 0,
  equipment_count INTEGER DEFAULT 0,
  
  -- Progress tracking
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  
  -- Dependencies
  depends_on UUID[], -- Array of task IDs that must complete before this starts
  blocks UUID[], -- Array of task IDs that cannot start until this completes
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create task daily logs table for detailed tracking
CREATE TABLE task_daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  
  -- Delay tracking
  delayed BOOLEAN DEFAULT false,
  delay_reason TEXT,
  delay_category VARCHAR(50), -- weather, equipment, crew, material, other
  
  -- Weather conditions at time of delay
  weather_snapshot JSONB,
  -- Example: {"temperature": 32, "wind_speed": 30, "precipitation": 0.5, "conditions": "Heavy Rain"}
  
  -- Work performed
  work_completed TEXT,
  crew_present UUID[], -- Which crew members showed up
  equipment_used UUID[], -- Which equipment was used
  hours_worked DECIMAL(4,2) DEFAULT 0,
  
  -- Progress
  progress_made INTEGER DEFAULT 0, -- Percentage progress made this day
  
  -- Notes
  notes TEXT,
  photos TEXT[], -- Array of photo URLs
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(task_id, log_date)
);

-- Create task templates table for different project types
CREATE TABLE task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_type VARCHAR(100) NOT NULL,
  
  -- Template details
  task_name VARCHAR(255) NOT NULL,
  task_type task_type NOT NULL,
  sequence_order INTEGER NOT NULL,
  typical_duration_days INTEGER DEFAULT 1,
  
  -- Weather sensitivity defaults
  weather_sensitive BOOLEAN DEFAULT true,
  weather_thresholds JSONB,
  
  -- Resource requirements
  typical_crew_size INTEGER DEFAULT 2,
  typical_equipment TEXT[], -- Equipment types typically needed
  
  -- Dependencies within template
  depends_on_sequence INTEGER[], -- Which sequence orders must complete first
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default task templates
INSERT INTO task_templates (project_type, task_name, task_type, sequence_order, typical_duration_days, weather_sensitive, weather_thresholds, typical_crew_size, typical_equipment) VALUES
-- Flat Roofing
('Flat Roofing', 'Mobilization & Setup', 'mobilization', 1, 1, false, null, 2, ARRAY['Truck', 'Safety Equipment']),
('Flat Roofing', 'Tear-off Existing Roof', 'tear_off', 2, 2, true, '{"wind_speed": 25, "precipitation": 0.1}'::jsonb, 4, ARRAY['Dumpster', 'Tear-off Tools']),
('Flat Roofing', 'Deck Repair', 'deck_repair', 3, 1, true, '{"precipitation": 0.05}'::jsonb, 3, ARRAY['Circular Saw', 'Drill']),
('Flat Roofing', 'Install Underlayment', 'underlayment', 4, 1, true, '{"wind_speed": 20, "precipitation": 0}'::jsonb, 3, ARRAY['Rolls', 'Fasteners']),
('Flat Roofing', 'Torch Weld Membrane', 'torch_weld', 5, 3, true, '{"wind_speed": 15, "precipitation": 0, "temperature_min": 40}'::jsonb, 4, ARRAY['Propane Torch', 'Safety Equipment']),
('Flat Roofing', 'Install Flashing', 'flashing', 6, 1, true, '{"precipitation": 0.05}'::jsonb, 2, ARRAY['Flashing Tools']),
('Flat Roofing', 'Final Inspection', 'inspection', 7, 1, false, null, 1, ARRAY['Inspection Tools']),
('Flat Roofing', 'Cleanup', 'cleanup', 8, 1, false, null, 2, ARRAY['Truck', 'Cleanup Tools']),

-- Framing
('Framing', 'Site Preparation', 'site_prep', 1, 1, true, '{"precipitation": 0.25}'::jsonb, 3, ARRAY['Excavator', 'Level']),
('Framing', 'Foundation Layout', 'site_prep', 2, 1, true, '{"precipitation": 0.1}'::jsonb, 2, ARRAY['Transit', 'Stakes']),
('Framing', 'Wall Framing', 'framing', 3, 5, true, '{"wind_speed": 30, "precipitation": 0.1}'::jsonb, 6, ARRAY['Nail Guns', 'Saws', 'Lift']),
('Framing', 'Roof Framing', 'framing', 4, 3, true, '{"wind_speed": 20, "precipitation": 0}'::jsonb, 4, ARRAY['Crane', 'Safety Harness']),
('Framing', 'Inspection', 'inspection', 5, 1, false, null, 1, ARRAY['Inspection Tools']),

-- Concrete Pour
('Concrete Pour', 'Excavation', 'excavation', 1, 2, true, '{"precipitation": 0.5}'::jsonb, 3, ARRAY['Excavator', 'Dump Truck']),
('Concrete Pour', 'Forming', 'forming', 2, 2, true, '{"precipitation": 0.25}'::jsonb, 4, ARRAY['Forms', 'Stakes', 'Level']),
('Concrete Pour', 'Rebar Installation', 'rebar_install', 3, 1, true, '{"precipitation": 0.1}'::jsonb, 3, ARRAY['Rebar', 'Tie Wire', 'Cutters']),
('Concrete Pour', 'Concrete Pour', 'concrete_pour', 4, 1, true, '{"temperature_min": 35, "temperature_max": 90, "precipitation": 0}'::jsonb, 6, ARRAY['Concrete Truck', 'Pump', 'Vibrator']),
('Concrete Pour', 'Finishing', 'concrete_finish', 5, 1, true, '{"precipitation": 0, "temperature_min": 40}'::jsonb, 3, ARRAY['Trowels', 'Edgers', 'Brooms']),
('Concrete Pour', 'Curing', 'concrete_finish', 6, 7, true, '{"temperature_min": 35}'::jsonb, 1, ARRAY['Curing Compound', 'Covers']),
('Concrete Pour', 'Backfill', 'backfill', 7, 1, true, '{"precipitation": 0.5}'::jsonb, 2, ARRAY['Excavator', 'Compactor']);

-- Create indexes
CREATE INDEX idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX idx_project_tasks_status ON project_tasks(status);
CREATE INDEX idx_project_tasks_delayed_today ON project_tasks(delayed_today);
CREATE INDEX idx_task_daily_logs_task_id ON task_daily_logs(task_id);
CREATE INDEX idx_task_daily_logs_log_date ON task_daily_logs(log_date);
CREATE INDEX idx_task_daily_logs_delayed ON task_daily_logs(delayed);
CREATE INDEX idx_task_templates_project_type ON task_templates(project_type);

-- Enable RLS
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_tasks
CREATE POLICY "Users can view tasks for their projects" ON project_tasks
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_profiles WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage tasks for their projects" ON project_tasks
    FOR ALL USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_profiles WHERE id = auth.uid()
            )
        )
    );

-- RLS Policies for task_daily_logs
CREATE POLICY "Users can view logs for their tasks" ON task_daily_logs
    FOR SELECT USING (
        task_id IN (
            SELECT id FROM project_tasks 
            WHERE project_id IN (
                SELECT id FROM projects 
                WHERE company_id IN (
                    SELECT company_id FROM user_profiles WHERE id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can manage logs for their tasks" ON task_daily_logs
    FOR ALL USING (
        task_id IN (
            SELECT id FROM project_tasks 
            WHERE project_id IN (
                SELECT id FROM projects 
                WHERE company_id IN (
                    SELECT company_id FROM user_profiles WHERE id = auth.uid()
                )
            )
        )
    );

-- RLS Policies for task_templates (read-only for all authenticated users)
CREATE POLICY "All users can view task templates" ON task_templates
    FOR SELECT USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_project_tasks_updated_at
    BEFORE UPDATE ON project_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_templates_updated_at
    BEFORE UPDATE ON task_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE project_tasks IS 'Granular task tracking for projects with weather sensitivity';
COMMENT ON TABLE task_daily_logs IS 'Daily logs for each task including delays and progress';
COMMENT ON TABLE task_templates IS 'Predefined task templates for different project types';
COMMENT ON COLUMN project_tasks.weather_thresholds IS 'JSON object with wind_speed, precipitation, temperature_min, temperature_max to override project defaults';
COMMENT ON COLUMN task_daily_logs.weather_snapshot IS 'Weather conditions at the time of the log entry';