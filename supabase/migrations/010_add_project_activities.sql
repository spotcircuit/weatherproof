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
CREATE INDEX idx_project_activities_project_id ON project_activities(project_id);
CREATE INDEX idx_project_activities_active ON project_activities(is_active);

-- Enable RLS
ALTER TABLE project_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view project activities for their projects" ON project_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_activities.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create project activities for their projects" ON project_activities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_activities.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update project activities for their projects" ON project_activities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_activities.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete project activities for their projects" ON project_activities
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_activities.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Update delays table to reference project activities
ALTER TABLE delays
ADD COLUMN IF NOT EXISTS project_activity_ids UUID[] DEFAULT '{}';

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_project_activities_updated_at 
  BEFORE UPDATE ON project_activities 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();