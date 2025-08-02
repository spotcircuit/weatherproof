-- Migrate existing users to company structure
-- This creates a default company for existing users and associates their data

DO $$
DECLARE
    default_company_id UUID;
    user_record RECORD;
    auth_user_count INTEGER;
    profile_count INTEGER;
BEGIN
    -- Wait for user_profiles table to exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        RAISE NOTICE 'user_profiles table does not exist yet, skipping migration';
        RETURN;
    END IF;

    -- Count auth users and profiles
    SELECT COUNT(*) INTO auth_user_count FROM auth.users;
    SELECT COUNT(*) INTO profile_count FROM user_profiles;
    
    RAISE NOTICE 'Found % auth users and % user profiles', auth_user_count, profile_count;

    -- First, ensure all auth users have user_profiles
    INSERT INTO user_profiles (id, role, is_active, created_at, updated_at)
    SELECT 
        u.id,
        'user',
        true,
        u.created_at,
        NOW()
    FROM auth.users u
    WHERE NOT EXISTS (
        SELECT 1 FROM user_profiles up WHERE up.id = u.id
    );

    -- Check if we need to create a default company
    IF EXISTS (
        SELECT 1 FROM user_profiles WHERE company_id IS NULL LIMIT 1
    ) THEN
        RAISE NOTICE 'Creating default company for existing users';
        
        -- Create a default company
        INSERT INTO companies (
            name,
            legal_name,
            email,
            created_by,
            company_type,
            is_active
        )
        VALUES (
            COALESCE(
                (SELECT name FROM projects WHERE active = true ORDER BY created_at DESC LIMIT 1),
                'WeatherProof Construction'
            ),
            'WeatherProof Construction LLC',
            (SELECT email FROM auth.users ORDER BY created_at ASC LIMIT 1),
            (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1),
            'contractor',
            true
        )
        RETURNING id INTO default_company_id;

        RAISE NOTICE 'Created company with ID: %', default_company_id;

        -- Update all user profiles to belong to this company
        UPDATE user_profiles 
        SET 
            company_id = default_company_id,
            role = CASE 
                WHEN id = (SELECT created_by FROM companies WHERE id = default_company_id) 
                THEN 'owner' 
                ELSE 'user' 
            END,
            updated_at = NOW()
        WHERE company_id IS NULL;

        -- Update all existing projects to belong to this company
        UPDATE projects 
        SET company_id = default_company_id
        WHERE company_id IS NULL;

        -- Create company_users entries for all users
        INSERT INTO company_users (company_id, user_id, role, is_active)
        SELECT 
            default_company_id,
            up.id,
            up.role,
            true
        FROM user_profiles up
        WHERE up.company_id = default_company_id
        AND NOT EXISTS (
            SELECT 1 FROM company_users cu 
            WHERE cu.company_id = default_company_id 
            AND cu.user_id = up.id
        );

        RAISE NOTICE 'Migration completed successfully';
    ELSE
        RAISE NOTICE 'All users already have companies, skipping migration';
    END IF;
END $$;

-- Add some helpful comments
COMMENT ON COLUMN companies.company_type IS 'Type of company: contractor (general contractor), subcontractor, client, supplier, etc.';
COMMENT ON COLUMN user_profiles.role IS 'User role within the company: owner, admin, manager, user, viewer';
COMMENT ON COLUMN projects.company_id IS 'Company that owns this project';
COMMENT ON COLUMN projects.company_id IS 'Company that owns this project';