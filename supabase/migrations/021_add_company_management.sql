-- Add company management tables and user profile extensions
-- This migration creates a flexible company structure that supports future multi-company scenarios

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    tax_id VARCHAR(50),
    logo_url TEXT,
    website VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    fax VARCHAR(50),
    
    -- Address fields
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    
    -- Business details
    license_number VARCHAR(100),
    insurance_carrier VARCHAR(255),
    insurance_policy_number VARCHAR(100),
    insurance_expiry DATE,
    bonding_company VARCHAR(255),
    bonding_number VARCHAR(100),
    bonding_limit DECIMAL(12, 2),
    
    -- Settings
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    currency VARCHAR(3) DEFAULT 'USD',
    fiscal_year_start INTEGER DEFAULT 1, -- Month number (1-12)
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    
    -- For future multi-tenant scenarios
    parent_company_id UUID REFERENCES companies(id),
    company_type VARCHAR(50) DEFAULT 'contractor' -- contractor, subcontractor, client, etc.
);

-- Create user_profiles table to extend auth.users
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id),
    
    -- Personal information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(200),
    phone VARCHAR(50),
    mobile_phone VARCHAR(50),
    
    -- Professional information
    job_title VARCHAR(100),
    department VARCHAR(100),
    employee_id VARCHAR(50),
    license_number VARCHAR(100),
    license_state VARCHAR(50),
    license_expiry DATE,
    
    -- Settings and preferences
    avatar_url TEXT,
    notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "in_app": true}'::jsonb,
    ui_preferences JSONB DEFAULT '{}'::jsonb,
    
    -- Permissions and roles
    role VARCHAR(50) DEFAULT 'user', -- admin, manager, user, viewer
    permissions JSONB DEFAULT '[]'::jsonb,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create company_users table for future multi-company support
-- This allows users to belong to multiple companies
CREATE TABLE IF NOT EXISTS company_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Role within this specific company
    role VARCHAR(50) DEFAULT 'user',
    permissions JSONB DEFAULT '[]'::jsonb,
    
    -- Employment details
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(company_id, user_id)
);

-- Add company_id to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Create indexes
CREATE INDEX idx_companies_created_by ON companies(created_by);
CREATE INDEX idx_companies_is_active ON companies(is_active);
CREATE INDEX idx_user_profiles_company_id ON user_profiles(company_id);
CREATE INDEX idx_company_users_company_id ON company_users(company_id);
CREATE INDEX idx_company_users_user_id ON company_users(user_id);
CREATE INDEX idx_projects_company_id ON projects(company_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_users_updated_at BEFORE UPDATE ON company_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to automatically create a user profile when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, first_name, last_name, display_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create RLS policies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;

-- Companies policies
CREATE POLICY "Users can view their own company" ON companies
    FOR SELECT USING (
        id IN (
            SELECT company_id FROM user_profiles WHERE id = auth.uid()
            UNION
            SELECT company_id FROM company_users WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Company admins can update their company" ON companies
    FOR UPDATE USING (
        id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'owner')
            UNION
            SELECT company_id FROM company_users 
            WHERE user_id = auth.uid() AND role IN ('admin', 'owner') AND is_active = true
        )
    );

CREATE POLICY "Only owners can create companies" ON companies
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- User profiles policies
CREATE POLICY "Users can view profiles in their company" ON user_profiles
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_profiles WHERE id = auth.uid()
            UNION
            SELECT company_id FROM company_users WHERE user_id = auth.uid() AND is_active = true
        )
        OR id = auth.uid()
    );

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can update profiles in their company" ON user_profiles
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'owner')
        )
    );

-- Company users policies
CREATE POLICY "Users can view company users for their companies" ON company_users
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_profiles WHERE id = auth.uid()
            UNION
            SELECT company_id FROM company_users WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Company admins can manage company users" ON company_users
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'owner')
            UNION
            SELECT company_id FROM company_users 
            WHERE user_id = auth.uid() AND role IN ('admin', 'owner') AND is_active = true
        )
    );

-- Update projects RLS to include company-based access
CREATE POLICY "Users can view projects from their company" ON projects
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_profiles WHERE id = auth.uid()
            UNION
            SELECT company_id FROM company_users WHERE user_id = auth.uid() AND is_active = true
        )
        OR user_id = auth.uid()
    );

-- Create helper functions

-- Function to get user's primary company
CREATE OR REPLACE FUNCTION get_user_company(user_uuid UUID)
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT company_id FROM user_profiles WHERE id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has role in company
CREATE OR REPLACE FUNCTION user_has_role_in_company(user_uuid UUID, company_uuid UUID, required_role VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = user_uuid AND company_id = company_uuid AND role = required_role
        UNION
        SELECT 1 FROM company_users 
        WHERE user_id = user_uuid AND company_id = company_uuid AND role = required_role AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create views for easier querying

-- View for users with their company information
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
    c.logo_url as company_logo
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN companies c ON up.company_id = c.id;

-- Grant access to the view
GRANT SELECT ON users_with_company TO authenticated;

-- Sample data comment (remove in production)
COMMENT ON TABLE companies IS 'Companies table supporting both single company mode and future multi-tenant scenarios';
COMMENT ON TABLE user_profiles IS 'Extended user information linked to auth.users';
COMMENT ON TABLE company_users IS 'Many-to-many relationship for users belonging to multiple companies';