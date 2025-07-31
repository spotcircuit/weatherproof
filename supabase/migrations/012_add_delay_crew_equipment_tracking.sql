-- Add tables to track specific crew and equipment affected by delays
-- This is REQUIRED for accurate insurance claim calculations

-- 1. Track which crew members were affected by each delay
CREATE TABLE IF NOT EXISTS delay_crew_affected (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  delay_event_id UUID REFERENCES delay_events(id) ON DELETE CASCADE NOT NULL,
  crew_member_id UUID REFERENCES crew_members(id) ON DELETE CASCADE NOT NULL,
  hours_idled DECIMAL(5,2) NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL, -- Rate at time of delay
  burden_rate DECIMAL(5,2) DEFAULT 1.35, -- Multiplier for benefits/taxes (35% default)
  total_cost DECIMAL(10,2) GENERATED ALWAYS AS (hours_idled * hourly_rate * burden_rate) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Track which equipment was affected by each delay
CREATE TABLE IF NOT EXISTS delay_equipment_affected (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  delay_event_id UUID REFERENCES delay_events(id) ON DELETE CASCADE NOT NULL,
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE NOT NULL,
  hours_idled DECIMAL(5,2) NOT NULL,
  standby_rate DECIMAL(10,2) NOT NULL, -- Standby rate (lower than operational)
  operational_rate DECIMAL(10,2), -- Normal operating rate for comparison
  is_rented BOOLEAN DEFAULT false,
  total_cost DECIMAL(10,2) GENERATED ALWAYS AS (hours_idled * standby_rate) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Add missing fields to equipment table for better cost tracking
ALTER TABLE equipment 
  ADD COLUMN IF NOT EXISTS standby_rate DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS is_rented BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS rental_company VARCHAR(255),
  ADD COLUMN IF NOT EXISTS burden_rate DECIMAL(5,2) DEFAULT 1.0;

-- 4. Add burden rate to crew members
ALTER TABLE crew_members
  ADD COLUMN IF NOT EXISTS burden_rate DECIMAL(5,2) DEFAULT 1.35,
  ADD COLUMN IF NOT EXISTS trade VARCHAR(100); -- Carpenter, Electrician, etc.

-- 5. Add computed total cost column to delay_events that sums all costs
ALTER TABLE delay_events
  ADD COLUMN IF NOT EXISTS computed_labor_cost DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS computed_equipment_cost DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS computed_total_cost DECIMAL(10,2);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_delay_crew_delay_id ON delay_crew_affected(delay_event_id);
CREATE INDEX IF NOT EXISTS idx_delay_equipment_delay_id ON delay_equipment_affected(delay_event_id);

-- 7. Create a view for easy delay cost summaries
CREATE OR REPLACE VIEW delay_cost_summary AS
SELECT 
  de.id,
  de.project_id,
  de.start_time,
  de.end_time,
  de.weather_condition,
  -- Calculate duration from start/end times if duration_hours doesn't exist
  CASE 
    WHEN de.end_time IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (de.end_time - de.start_time)) / 3600
    ELSE NULL
  END as duration_hours,
  -- Crew costs
  COALESCE(crew_costs.total_crew_cost, 0) as crew_cost,
  COALESCE(crew_costs.crew_count, 0) as crew_affected_count,
  -- Equipment costs
  COALESCE(equipment_costs.total_equipment_cost, 0) as equipment_cost,
  COALESCE(equipment_costs.equipment_count, 0) as equipment_affected_count,
  -- Total costs
  COALESCE(crew_costs.total_crew_cost, 0) + 
  COALESCE(equipment_costs.total_equipment_cost, 0) + 
  COALESCE(de.overhead_cost, 0) as total_calculated_cost
FROM delay_events de
LEFT JOIN (
  SELECT 
    delay_event_id,
    SUM(total_cost) as total_crew_cost,
    COUNT(*) as crew_count
  FROM delay_crew_affected
  GROUP BY delay_event_id
) crew_costs ON crew_costs.delay_event_id = de.id
LEFT JOIN (
  SELECT 
    delay_event_id,
    SUM(total_cost) as total_equipment_cost,
    COUNT(*) as equipment_count
  FROM delay_equipment_affected
  GROUP BY delay_event_id
) equipment_costs ON equipment_costs.delay_event_id = de.id;

-- 8. Add RLS policies for new tables
ALTER TABLE delay_crew_affected ENABLE ROW LEVEL SECURITY;
ALTER TABLE delay_equipment_affected ENABLE ROW LEVEL SECURITY;

-- Crew affected policies
CREATE POLICY "Users can view delay crew through projects" ON delay_crew_affected
  FOR SELECT USING (
    delay_event_id IN (
      SELECT de.id FROM delay_events de
      JOIN projects p ON p.id = de.project_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert delay crew through projects" ON delay_crew_affected
  FOR INSERT WITH CHECK (
    delay_event_id IN (
      SELECT de.id FROM delay_events de
      JOIN projects p ON p.id = de.project_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update delay crew through projects" ON delay_crew_affected
  FOR UPDATE USING (
    delay_event_id IN (
      SELECT de.id FROM delay_events de
      JOIN projects p ON p.id = de.project_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete delay crew through projects" ON delay_crew_affected
  FOR DELETE USING (
    delay_event_id IN (
      SELECT de.id FROM delay_events de
      JOIN projects p ON p.id = de.project_id
      WHERE p.user_id = auth.uid()
    )
  );

-- Equipment affected policies (same pattern)
CREATE POLICY "Users can view delay equipment through projects" ON delay_equipment_affected
  FOR SELECT USING (
    delay_event_id IN (
      SELECT de.id FROM delay_events de
      JOIN projects p ON p.id = de.project_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert delay equipment through projects" ON delay_equipment_affected
  FOR INSERT WITH CHECK (
    delay_event_id IN (
      SELECT de.id FROM delay_events de
      JOIN projects p ON p.id = de.project_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update delay equipment through projects" ON delay_equipment_affected
  FOR UPDATE USING (
    delay_event_id IN (
      SELECT de.id FROM delay_events de
      JOIN projects p ON p.id = de.project_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete delay equipment through projects" ON delay_equipment_affected
  FOR DELETE USING (
    delay_event_id IN (
      SELECT de.id FROM delay_events de
      JOIN projects p ON p.id = de.project_id
      WHERE p.user_id = auth.uid()
    )
  );

-- Comment for clarity
COMMENT ON TABLE delay_crew_affected IS 'Tracks specific crew members affected by each delay event for accurate cost calculation';
COMMENT ON TABLE delay_equipment_affected IS 'Tracks specific equipment idled during each delay event with standby rates';
COMMENT ON COLUMN delay_crew_affected.burden_rate IS 'Multiplier for benefits, taxes, insurance (e.g., 1.35 = 35% burden)';
COMMENT ON COLUMN delay_equipment_affected.standby_rate IS 'Idle/standby rate per hour (typically 50-70% of operational rate)';