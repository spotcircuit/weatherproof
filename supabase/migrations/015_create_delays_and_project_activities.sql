-- Migration 015: Create delays table and project activities
-- This ensures all required tables exist

-- First, create delays table if it doesn't exist
CREATE TABLE IF NOT EXISTS delays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  delay_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  weather_conditions TEXT[],
  temperature DECIMAL(5,2),
  wind_speed DECIMAL(5,2),
  precipitation DECIMAL(5,2),
  description TEXT,
  crew_count INTEGER DEFAULT 0,
  equipment_units INTEGER DEFAULT 0,
  activities_affected TEXT[],
  documentation TEXT,
  photos TEXT[],
  videos TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id),
  reason TEXT
);

-- Create indexes for delays
CREATE INDEX IF NOT EXISTS idx_delays_project_id ON delays(project_id);
CREATE INDEX IF NOT EXISTS idx_delays_delay_date ON delays(delay_date);
CREATE INDEX IF NOT EXISTS idx_delays_user_id ON delays(user_id);

-- Enable RLS on delays
ALTER TABLE delays ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can view their own delays" ON delays;
CREATE POLICY "Users can view their own delays" ON delays
  FOR SELECT USING (user_id = auth.uid() OR auth.uid() IN (
    SELECT user_id FROM projects WHERE id = delays.project_id
  ));

DROP POLICY IF EXISTS "Users can create delays for their projects" ON delays;
CREATE POLICY "Users can create delays for their projects" ON delays
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM projects WHERE id = delays.project_id)
  );

DROP POLICY IF EXISTS "Users can update their own delays" ON delays;
CREATE POLICY "Users can update their own delays" ON delays
  FOR UPDATE USING (user_id = auth.uid() OR auth.uid() IN (
    SELECT user_id FROM projects WHERE id = delays.project_id
  ));

DROP POLICY IF EXISTS "Users can delete their own delays" ON delays;
CREATE POLICY "Users can delete their own delays" ON delays
  FOR DELETE USING (user_id = auth.uid() OR auth.uid() IN (
    SELECT user_id FROM projects WHERE id = delays.project_id
  ));

-- Add contractor type to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS contractor_type TEXT;

-- Create project activities table
CREATE TABLE IF NOT EXISTS project_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  activity_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- Indicates if this was a default activity for the project type
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, activity_name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_activities_project_id ON project_activities(project_id);
CREATE INDEX IF NOT EXISTS idx_project_activities_active ON project_activities(is_active);

-- Enable RLS
ALTER TABLE project_activities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can view project activities for their projects" ON project_activities;
CREATE POLICY "Users can view project activities for their projects" ON project_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_activities.project_id 
      AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create project activities for their projects" ON project_activities;
CREATE POLICY "Users can create project activities for their projects" ON project_activities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_activities.project_id 
      AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update project activities for their projects" ON project_activities;
CREATE POLICY "Users can update project activities for their projects" ON project_activities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_activities.project_id 
      AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete project activities for their projects" ON project_activities;
CREATE POLICY "Users can delete project activities for their projects" ON project_activities
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_activities.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Update delays table to reference project activities (only if column doesn't exist)
ALTER TABLE delays
ADD COLUMN IF NOT EXISTS project_activity_ids UUID[] DEFAULT '{}';

-- Add updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
DROP TRIGGER IF EXISTS update_project_activities_updated_at ON project_activities;
CREATE TRIGGER update_project_activities_updated_at 
  BEFORE UPDATE ON project_activities 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_delays_updated_at ON delays;
CREATE TRIGGER update_delays_updated_at 
  BEFORE UPDATE ON delays 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();