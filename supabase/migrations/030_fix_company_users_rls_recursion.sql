-- Fix infinite recursion in company_users RLS policies

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view company_users in their company" ON company_users;
DROP POLICY IF EXISTS "Company admins can manage company_users" ON company_users;
DROP POLICY IF EXISTS "Users can view their company users" ON company_users;
DROP POLICY IF EXISTS "Company admins can manage users" ON company_users;

-- Create non-recursive policies for company_users
CREATE POLICY "Users can view their own company_users entry" ON company_users
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view company_users in their company direct" ON company_users
    FOR SELECT USING (
        company_id = (
            SELECT company_id 
            FROM user_profiles 
            WHERE id = auth.uid() 
            LIMIT 1
        )
    );

CREATE POLICY "Company admins can manage company_users" ON company_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 
            FROM user_profiles 
            WHERE id = auth.uid() 
            AND company_id = company_users.company_id
            AND role IN ('owner', 'admin')
        )
    );