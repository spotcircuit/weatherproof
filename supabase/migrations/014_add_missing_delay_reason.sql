-- Add missing delay_reason column to delay_events table

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'delay_events' 
        AND column_name = 'delay_reason'
    ) THEN
        ALTER TABLE delay_events ADD COLUMN delay_reason TEXT;
    END IF;
END $$;

-- Also check for other potentially missing columns referenced in the code
DO $$
BEGIN
    -- crew_affected
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'delay_events' 
        AND column_name = 'crew_affected'
    ) THEN
        ALTER TABLE delay_events ADD COLUMN crew_affected INTEGER;
    END IF;

    -- delay_type
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'delay_events' 
        AND column_name = 'delay_type'
    ) THEN
        ALTER TABLE delay_events ADD COLUMN delay_type VARCHAR(50) DEFAULT 'weather';
    END IF;

    -- supervisor_notes
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'delay_events' 
        AND column_name = 'supervisor_notes'
    ) THEN
        ALTER TABLE delay_events ADD COLUMN supervisor_notes TEXT;
    END IF;
END $$;