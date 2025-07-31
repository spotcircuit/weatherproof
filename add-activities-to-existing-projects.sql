-- Add default activities to existing projects that don't have any
-- Run this in Supabase SQL Editor

-- First, let's see which projects don't have activities
WITH projects_without_activities AS (
  SELECT p.id, p.name, p.contractor_type
  FROM projects p
  LEFT JOIN project_activities pa ON p.id = pa.project_id
  WHERE pa.id IS NULL
)
SELECT * FROM projects_without_activities;

-- Add default General Contractor activities to projects without activities
INSERT INTO project_activities (project_id, activity_name, is_active, is_default)
SELECT 
  p.id,
  activity.name,
  true,
  true
FROM projects p
CROSS JOIN (
  VALUES 
    ('Concrete Work'),
    ('Framing'),
    ('Excavation'),
    ('Foundation Work'),
    ('Site Preparation'),
    ('Roofing'),
    ('Electrical'),
    ('Plumbing'),
    ('Drywall'),
    ('Painting'),
    ('Flooring'),
    ('HVAC')
) AS activity(name)
WHERE NOT EXISTS (
  SELECT 1 FROM project_activities pa 
  WHERE pa.project_id = p.id
)
ON CONFLICT (project_id, activity_name) DO NOTHING;