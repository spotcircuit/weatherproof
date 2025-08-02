-- Create Demo Construction Co and update company structure

-- First, update any existing company to be Demo Construction Co
UPDATE companies 
SET 
    name = 'Demo Construction Co',
    legal_name = 'Demo Construction Company LLC',
    company_type = 'general_contractor',
    phone = '(555) 123-4567',
    address_line1 = '123 Construction Way',
    city = 'Austin',
    state = 'TX',
    zip_code = '78701',
    timezone = 'America/Chicago',
    license_number = 'GC-2024-TX-12345',
    insurance_carrier = 'Construction Insurance Corp',
    insurance_policy_number = 'POL-2024-001',
    tax_id = '12-3456789',
    billing_email = 'billing@democonstruction.co',
    billing_address_line1 = '123 Construction Way',
    billing_city = 'Austin',
    billing_state = 'TX',
    billing_zip_code = '78701',
    website = 'https://democonstruction.co',
    logo_url = null,
    primary_color = '#1e40af',
    secondary_color = '#3b82f6',
    specialties = ARRAY['Commercial Construction', 'Industrial Projects', 'Infrastructure'],
    certifications = ARRAY['OSHA Certified', 'ISO 9001:2015', 'LEED Certified'],
    service_areas = ARRAY['Austin', 'San Antonio', 'Houston', 'Dallas'],
    employee_count = '50-100',
    annual_revenue = '10M-25M',
    established_year = 2015,
    description = 'Demo Construction Co is a leading general contractor specializing in commercial and industrial construction projects throughout Texas.',
    notes = 'Primary demo company for WeatherProof platform demonstrations.',
    payment_terms = 'Net 30',
    default_markup_percentage = 15.00,
    updated_at = NOW()
WHERE id = (SELECT id FROM companies LIMIT 1);

-- If no company exists, create Demo Construction Co
INSERT INTO companies (
    name,
    legal_name,
    email,
    company_type,
    phone,
    address_line1,
    city,
    state,
    zip_code,
    timezone,
    license_number,
    insurance_carrier,
    insurance_policy_number,
    tax_id,
    billing_email,
    billing_address_line1,
    billing_city,
    billing_state,
    billing_zip_code,
    website,
    primary_color,
    secondary_color,
    specialties,
    certifications,
    service_areas,
    employee_count,
    annual_revenue,
    established_year,
    description,
    notes,
    payment_terms,
    default_markup_percentage,
    is_active,
    created_by
)
SELECT
    'Demo Construction Co',
    'Demo Construction Company LLC',
    COALESCE(
        (SELECT email FROM auth.users ORDER BY created_at ASC LIMIT 1),
        'demo@democonstruction.co'
    ),
    'general_contractor',
    '(555) 123-4567',
    '123 Construction Way',
    'Austin',
    'TX',
    '78701',
    'America/Chicago',
    'GC-2024-TX-12345',
    'Construction Insurance Corp',
    'POL-2024-001',
    '12-3456789',
    'billing@democonstruction.co',
    '123 Construction Way',
    'Austin',
    'TX',
    '78701',
    'https://democonstruction.co',
    '#1e40af',
    '#3b82f6',
    ARRAY['Commercial Construction', 'Industrial Projects', 'Infrastructure'],
    ARRAY['OSHA Certified', 'ISO 9001:2015', 'LEED Certified'],
    ARRAY['Austin', 'San Antonio', 'Houston', 'Dallas'],
    '50-100',
    '10M-25M',
    2015,
    'Demo Construction Co is a leading general contractor specializing in commercial and industrial construction projects throughout Texas.',
    'Primary demo company for WeatherProof platform demonstrations.',
    'Net 30',
    15.00,
    true,
    (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM companies);

-- Ensure all users are connected to Demo Construction Co
DO $$
DECLARE
    company_id UUID;
    user_record RECORD;
BEGIN
    -- Get the company ID
    SELECT id INTO company_id FROM companies WHERE name = 'Demo Construction Co' LIMIT 1;
    
    IF company_id IS NOT NULL THEN
        -- Update all user profiles to be connected to this company
        UPDATE user_profiles 
        SET company_id = company_id
        WHERE company_id IS NULL OR company_id != company_id;
        
        -- Ensure all users have entries in company_users table
        FOR user_record IN SELECT id, email FROM auth.users LOOP
            INSERT INTO company_users (company_id, user_id, role, is_active)
            VALUES (
                company_id, 
                user_record.id,
                CASE 
                    WHEN user_record.email = 'demo@weatherproof.app' THEN 'user'
                    ELSE 'owner'
                END,
                true
            )
            ON CONFLICT (company_id, user_id) 
            DO UPDATE SET 
                is_active = true,
                updated_at = NOW();
        END LOOP;
        
        -- Update all projects to belong to this company
        UPDATE projects 
        SET company_id = company_id
        WHERE company_id IS NULL;
        
        -- Update all crew members to belong to this company
        UPDATE crew_members 
        SET company_id = company_id
        WHERE company_id IS NULL;
        
        -- Update all equipment to belong to this company
        UPDATE equipment 
        SET company_id = company_id
        WHERE company_id IS NULL;
    END IF;
END $$;

-- Add some demo team members to company_users for testing
-- These are placeholder entries that can be replaced with real invited users later
INSERT INTO company_users (company_id, user_id, role, is_active, invited_email, invited_at, invited_by)
SELECT 
    c.id,
    gen_random_uuid(),
    role,
    false,
    email,
    NOW(),
    (SELECT id FROM auth.users WHERE email != 'demo@weatherproof.app' LIMIT 1)
FROM companies c
CROSS JOIN (VALUES 
    ('john.smith@democonstruction.co', 'manager'),
    ('sarah.johnson@democonstruction.co', 'user'),
    ('mike.williams@democonstruction.co', 'viewer')
) AS demo_users(email, role)
WHERE c.name = 'Demo Construction Co'
ON CONFLICT DO NOTHING;