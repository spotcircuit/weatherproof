-- Add company_id to projects table if it doesn't exist

-- Add company_id column to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON projects(company_id);

-- Update RLS policies for projects to include company-based access
-- Drop all existing project policies first
DROP POLICY IF EXISTS "Users can view their projects" ON projects;
DROP POLICY IF EXISTS "Users can view projects from their company" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects for their company" ON projects;
DROP POLICY IF EXISTS "Users can update their projects" ON projects;
DROP POLICY IF EXISTS "Users can update projects from their company" ON projects;
DROP POLICY IF EXISTS "Users can delete their projects" ON projects;
DROP POLICY IF EXISTS "Users can delete projects from their company" ON projects;

-- Create new company-based policies
CREATE POLICY "Users can view projects from their company" ON projects
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_profiles WHERE id = auth.uid()
            UNION
            SELECT company_id FROM company_users WHERE user_id = auth.uid() AND is_active = true
        )
        OR user_id = auth.uid()
    );

CREATE POLICY "Users can create projects for their company" ON projects
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_profiles WHERE id = auth.uid()
            UNION
            SELECT company_id FROM company_users WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can update projects from their company" ON projects
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM user_profiles WHERE id = auth.uid()
            UNION
            SELECT company_id FROM company_users WHERE user_id = auth.uid() AND is_active = true
        )
        OR user_id = auth.uid()
    );

CREATE POLICY "Users can delete projects from their company" ON projects
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM user_profiles WHERE id = auth.uid()
            UNION
            SELECT company_id FROM company_users WHERE user_id = auth.uid() AND is_active = true
        )
        OR user_id = auth.uid()
    );

-- Create company_crew table to manage crew members at the company level
CREATE TABLE IF NOT EXISTS company_crew (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    hourly_rate DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    skills TEXT[],
    certifications TEXT[],
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    hire_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    CONSTRAINT unique_company_crew_email UNIQUE(company_id, email)
);

-- Create company_equipment table to manage equipment at the company level
CREATE TABLE IF NOT EXISTS company_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    model VARCHAR(255),
    serial_number VARCHAR(255),
    purchase_date DATE,
    purchase_price DECIMAL(10,2),
    current_value DECIMAL(10,2),
    hourly_rate DECIMAL(10,2) DEFAULT 0,
    daily_rate DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    status VARCHAR(50) DEFAULT 'available', -- available, in_use, maintenance, retired
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    maintenance_notes TEXT,
    location VARCHAR(255),
    assigned_to UUID REFERENCES company_crew(id),
    insurance_policy_number VARCHAR(255),
    insurance_expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    CONSTRAINT unique_company_equipment_serial UNIQUE(company_id, serial_number)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_company_crew_company_id ON company_crew(company_id);
CREATE INDEX IF NOT EXISTS idx_company_crew_is_active ON company_crew(is_active);
CREATE INDEX IF NOT EXISTS idx_company_equipment_company_id ON company_equipment(company_id);
CREATE INDEX IF NOT EXISTS idx_company_equipment_status ON company_equipment(status);
CREATE INDEX IF NOT EXISTS idx_company_equipment_assigned_to ON company_equipment(assigned_to);

-- Enable RLS
ALTER TABLE company_crew ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_equipment ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_crew
CREATE POLICY "Users can view crew from their company" ON company_crew
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_profiles WHERE id = auth.uid()
            UNION
            SELECT company_id FROM company_users WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can manage crew for their company" ON company_crew
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('owner', 'admin', 'manager')
            UNION
            SELECT company_id FROM company_users 
            WHERE user_id = auth.uid() 
            AND is_active = true 
            AND role IN ('owner', 'admin', 'manager')
        )
    );

-- RLS Policies for company_equipment
CREATE POLICY "Users can view equipment from their company" ON company_equipment
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_profiles WHERE id = auth.uid()
            UNION
            SELECT company_id FROM company_users WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can manage equipment for their company" ON company_equipment
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('owner', 'admin', 'manager')
            UNION
            SELECT company_id FROM company_users 
            WHERE user_id = auth.uid() 
            AND is_active = true 
            AND role IN ('owner', 'admin', 'manager')
        )
    );

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_crew_updated_at
    BEFORE UPDATE ON company_crew
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_equipment_updated_at
    BEFORE UPDATE ON company_equipment
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE company_crew IS 'Company-level crew member management';
COMMENT ON TABLE company_equipment IS 'Company-level equipment management';
COMMENT ON COLUMN projects.company_id IS 'Company that owns this project';