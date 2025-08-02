-- Fix users_with_company view to include created_at column
-- This fixes the settings page issue where it tries to order by created_at

-- Drop and recreate the view with the missing created_at column
CREATE OR REPLACE VIEW users_with_company AS
SELECT 
    u.id,
    u.email,
    u.created_at as user_created_at,
    up.first_name,
    up.last_name,
    up.display_name,
    up.phone,
    up.job_title,
    up.role,
    up.is_active,
    up.company_id,
    c.name as company_name,
    c.logo_url as company_logo,
    -- Add the missing created_at column that the settings page expects
    up.created_at,
    up.updated_at
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN companies c ON up.company_id = c.id;

-- Ensure permissions are maintained
GRANT SELECT ON users_with_company TO authenticated;

-- Add comment explaining the fix
COMMENT ON VIEW users_with_company IS 'View combining user auth data with profiles and company info. Fixed to include created_at for settings page ordering.';