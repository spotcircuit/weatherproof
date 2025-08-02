-- Create task-level crew and equipment assignment tables

-- Create task crew assignments table
CREATE TABLE task_crew_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  crew_member_id UUID REFERENCES crew_members(id) ON DELETE SET NULL,
  
  -- For outsourced/external crew
  is_outsourced BOOLEAN DEFAULT false,
  outsource_company_name VARCHAR(255),
  outsource_crew_size INTEGER,
  outsource_contact_name VARCHAR(255),
  outsource_contact_phone VARCHAR(50),
  outsource_rate_type VARCHAR(50), -- 'hourly', 'daily', 'fixed'
  outsource_rate DECIMAL(10,2),
  
  -- Assignment details
  assigned_date DATE NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  role VARCHAR(100), -- 'lead', 'helper', 'specialist'
  
  -- Status
  status VARCHAR(50) DEFAULT 'assigned', -- 'assigned', 'confirmed', 'on_site', 'completed'
  actual_hours_worked DECIMAL(5,2),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure no duplicate assignments
  CONSTRAINT unique_task_crew_member UNIQUE(task_id, crew_member_id)
);

-- Create task equipment assignments table
CREATE TABLE task_equipment_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES equipment(id) ON DELETE SET NULL,
  
  -- For rented/external equipment
  is_rented BOOLEAN DEFAULT false,
  rental_company_name VARCHAR(255),
  rental_equipment_type VARCHAR(255),
  rental_rate_type VARCHAR(50), -- 'hourly', 'daily', 'weekly'
  rental_rate DECIMAL(10,2),
  rental_start_date DATE,
  rental_end_date DATE,
  
  -- Assignment details
  assigned_date DATE NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  quantity INTEGER DEFAULT 1,
  
  -- Usage tracking
  actual_hours_used DECIMAL(5,2),
  fuel_consumption DECIMAL(10,2),
  maintenance_notes TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'assigned', -- 'assigned', 'delivered', 'in_use', 'returned'
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure no duplicate assignments
  CONSTRAINT unique_task_equipment UNIQUE(task_id, equipment_id)
);

-- Create a view for task resource summary
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

-- Create indexes
CREATE INDEX idx_task_crew_assignments_task_id ON task_crew_assignments(task_id);
CREATE INDEX idx_task_crew_assignments_crew_member_id ON task_crew_assignments(crew_member_id);
CREATE INDEX idx_task_crew_assignments_is_outsourced ON task_crew_assignments(is_outsourced);
CREATE INDEX idx_task_equipment_assignments_task_id ON task_equipment_assignments(task_id);
CREATE INDEX idx_task_equipment_assignments_equipment_id ON task_equipment_assignments(equipment_id);
CREATE INDEX idx_task_equipment_assignments_is_rented ON task_equipment_assignments(is_rented);

-- Enable RLS
ALTER TABLE task_crew_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_equipment_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_crew_assignments
CREATE POLICY "Users can view crew assignments for their tasks" ON task_crew_assignments
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

CREATE POLICY "Users can manage crew assignments for their tasks" ON task_crew_assignments
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

-- RLS Policies for task_equipment_assignments
CREATE POLICY "Users can view equipment assignments for their tasks" ON task_equipment_assignments
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

CREATE POLICY "Users can manage equipment assignments for their tasks" ON task_equipment_assignments
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

-- Grant access to views
GRANT SELECT ON task_resource_summary TO authenticated;

-- Create triggers for updated_at
CREATE TRIGGER update_task_crew_assignments_updated_at
    BEFORE UPDATE ON task_crew_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_equipment_assignments_updated_at
    BEFORE UPDATE ON task_equipment_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update project_tasks to remove the array columns (using join tables instead)
ALTER TABLE project_tasks 
  DROP COLUMN IF EXISTS assigned_crew,
  DROP COLUMN IF EXISTS assigned_equipment;

-- Comments
COMMENT ON TABLE task_crew_assignments IS 'Crew assignments at task level, including outsourced crews';
COMMENT ON TABLE task_equipment_assignments IS 'Equipment assignments at task level, including rented equipment';
COMMENT ON COLUMN task_crew_assignments.is_outsourced IS 'True if this is an external/subcontracted crew';
COMMENT ON COLUMN task_equipment_assignments.is_rented IS 'True if this equipment is rented rather than owned';