-- Fix RLS recursion for user_profiles table by creating a helper function first

-- Create a function to get user's company without RLS recursion
CREATE OR REPLACE FUNCTION get_user_company_direct(user_id UUID)
RETURNS UUID AS $$
DECLARE
    company_id UUID;
BEGIN
    -- Direct query without RLS to avoid recursion
    SELECT up.company_id INTO company_id
    FROM user_profiles up
    WHERE up.id = user_id
    LIMIT 1;
    
    RETURN company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_company_direct TO authenticated;

-- Now fix the RLS policies (rest of migration 026 remains the same)

-- Drop all existing policies on user_profiles to start fresh
DROP POLICY IF EXISTS "Users can view user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view profiles from their company" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their profile" ON user_profiles;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (id = auth.uid());

-- Create a separate policy for viewing company members using the helper function
CREATE POLICY "Users can view company members profiles" ON user_profiles
    FOR SELECT USING (
        -- Can view profiles of users in the same company
        company_id = get_user_company_direct(auth.uid())
        AND company_id IS NOT NULL
    );

-- Fix the users_with_company view to include created_at
DROP VIEW IF EXISTS users_with_company;
CREATE VIEW users_with_company AS
SELECT 
    u.id,
    u.email,
    u.created_at,  -- Add this column
    u.updated_at,  -- Add this column
    up.first_name,
    up.last_name,
    up.display_name,
    up.phone,
    up.job_title,
    up.department,
    up.avatar_url,
    up.company_id,
    cu.role as company_role,
    cu.is_active as is_company_active,
    cu.permissions as company_permissions,
    c.name as company_name,
    c.logo_url as company_logo_url,
    c.timezone as company_timezone
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN company_users cu ON u.id = cu.user_id AND up.company_id = cu.company_id
LEFT JOIN companies c ON up.company_id = c.id;

-- Grant permissions on the view
GRANT SELECT ON users_with_company TO authenticated;