-- Add invited_name column to company_users table for pending invitations

ALTER TABLE company_users
ADD COLUMN IF NOT EXISTS invited_name VARCHAR(255);

-- Add comment
COMMENT ON COLUMN company_users.invited_name IS 'Display name for invited users who have not yet registered';