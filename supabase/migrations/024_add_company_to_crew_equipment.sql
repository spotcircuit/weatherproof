-- Add company_id to crew_members and equipment tables

-- Add company_id to crew_members
ALTER TABLE crew_members
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Add company_id to equipment
ALTER TABLE equipment
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_crew_members_company_id ON crew_members(company_id);
CREATE INDEX IF NOT EXISTS idx_equipment_company_id ON equipment(company_id);

-- Update RLS policies for crew_members
DROP POLICY IF EXISTS "Users can view crew members" ON crew_members;
CREATE POLICY "Users can view crew members from their company" ON crew_members
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_profiles WHERE id = auth.uid()
            UNION
            SELECT company_id FROM company_users WHERE user_id = auth.uid() AND is_active = true
        )
        OR user_id = auth.uid()
    );

DROP POLICY IF EXISTS "Users can create crew members" ON crew_members;
CREATE POLICY "Users can create crew members for their company" ON crew_members
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_profiles WHERE id = auth.uid()
            UNION
            SELECT company_id FROM company_users WHERE user_id = auth.uid() AND is_active = true
        )
    );

DROP POLICY IF EXISTS "Users can update their crew members" ON crew_members;
CREATE POLICY "Users can update crew members from their company" ON crew_members
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM user_profiles WHERE id = auth.uid()
            UNION
            SELECT company_id FROM company_users WHERE user_id = auth.uid() AND is_active = true
        )
    );

DROP POLICY IF EXISTS "Users can delete their crew members" ON crew_members;
CREATE POLICY "Users can delete crew members from their company" ON crew_members
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM user_profiles WHERE id = auth.uid()
            UNION
            SELECT company_id FROM company_users WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Update RLS policies for equipment
DROP POLICY IF EXISTS "Users can view equipment" ON equipment;
CREATE POLICY "Users can view equipment from their company" ON equipment
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_profiles WHERE id = auth.uid()
            UNION
            SELECT company_id FROM company_users WHERE user_id = auth.uid() AND is_active = true
        )
        OR user_id = auth.uid()
    );

DROP POLICY IF EXISTS "Users can create equipment" ON equipment;
CREATE POLICY "Users can create equipment for their company" ON equipment
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_profiles WHERE id = auth.uid()
            UNION
            SELECT company_id FROM company_users WHERE user_id = auth.uid() AND is_active = true
        )
    );

DROP POLICY IF EXISTS "Users can update their equipment" ON equipment;
CREATE POLICY "Users can update equipment from their company" ON equipment
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM user_profiles WHERE id = auth.uid()
            UNION
            SELECT company_id FROM company_users WHERE user_id = auth.uid() AND is_active = true
        )
    );

DROP POLICY IF EXISTS "Users can delete their equipment" ON equipment;
CREATE POLICY "Users can delete equipment from their company" ON equipment
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM user_profiles WHERE id = auth.uid()
            UNION
            SELECT company_id FROM company_users WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Comments
COMMENT ON COLUMN crew_members.company_id IS 'Company that owns this crew member';
COMMENT ON COLUMN equipment.company_id IS 'Company that owns this equipment';