-- Add deadline fields to projects table
ALTER TABLE projects
ADD COLUMN deadline_date date,
ADD COLUMN deadline_type text CHECK (deadline_type IN ('contract', 'milestone', 'weather_window', 'permit_expiry', 'insurance_claim', 'other')),
ADD COLUMN deadline_notes text;

-- Add index for deadline queries
CREATE INDEX idx_projects_deadline_date ON projects(deadline_date);

-- Add comment to explain the fields
COMMENT ON COLUMN projects.deadline_date IS 'The deadline date for the project or current milestone';
COMMENT ON COLUMN projects.deadline_type IS 'Type of deadline: contract, milestone, weather_window, permit_expiry, insurance_claim, other';
COMMENT ON COLUMN projects.deadline_notes IS 'Additional notes about the deadline';