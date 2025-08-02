-- Fix all RLS policies to avoid infinite recursion

-- First, drop ALL existing policies on companies table
DROP POLICY IF EXISTS "Users can view their own company" ON companies;
DROP POLICY IF EXISTS "Company admins can update their company" ON companies;
DROP POLICY IF EXISTS "Only owners can create companies" ON companies;

-- Create simple, direct policies for companies
CREATE POLICY "Users can view companies they belong to" ON companies
    FOR SELECT USING (
        id IN (
            SELECT company_id FROM user_profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Company owners and admins can update their company" ON companies
    FOR UPDATE USING (
        id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Anyone can create a company" ON companies
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Fix company_users policies (from previous migration)
DROP POLICY IF EXISTS "Users can view their own company_users entry" ON company_users;
DROP POLICY IF EXISTS "Users can view company_users in their company direct" ON company_users;
DROP POLICY IF EXISTS "Company admins can manage company_users" ON company_users;

-- Simpler company_users policies
CREATE POLICY "Users can view company_users" ON company_users
    FOR SELECT USING (
        user_id = auth.uid() 
        OR 
        company_id IN (
            SELECT company_id FROM user_profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Company admins can insert company_users" ON company_users
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Company admins can update company_users" ON company_users
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Company admins can delete company_users" ON company_users
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );