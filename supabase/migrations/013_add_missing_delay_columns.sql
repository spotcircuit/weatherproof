-- Add missing columns to delay_events table
-- These columns are referenced in the code but may be missing from the database

-- Add duration_hours if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'delay_events' 
        AND column_name = 'duration_hours'
    ) THEN
        ALTER TABLE delay_events ADD COLUMN duration_hours DECIMAL(10,2);
        
        -- Update existing records to calculate duration_hours from start/end times
        UPDATE delay_events 
        SET duration_hours = EXTRACT(EPOCH FROM (end_time - start_time)) / 3600
        WHERE end_time IS NOT NULL AND duration_hours IS NULL;
    END IF;
END $$;

-- Add labor_hours_lost if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'delay_events' 
        AND column_name = 'labor_hours_lost'
    ) THEN
        ALTER TABLE delay_events ADD COLUMN labor_hours_lost DECIMAL(10,2);
    END IF;
END $$;

-- Add noaa_report_url if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'delay_events' 
        AND column_name = 'noaa_report_url'
    ) THEN
        ALTER TABLE delay_events ADD COLUMN noaa_report_url TEXT;
    END IF;
END $$;

-- Add report_generated if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'delay_events' 
        AND column_name = 'report_generated'
    ) THEN
        ALTER TABLE delay_events ADD COLUMN report_generated BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add a trigger to automatically calculate duration_hours
CREATE OR REPLACE FUNCTION calculate_duration_hours()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
        NEW.duration_hours = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 3600;
        
        -- Also calculate labor_hours_lost if crew info is available
        IF NEW.crew_affected IS NOT NULL AND NEW.duration_hours IS NOT NULL THEN
            NEW.labor_hours_lost = NEW.crew_affected * NEW.duration_hours;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new inserts and updates
DROP TRIGGER IF EXISTS calculate_duration_hours_trigger ON delay_events;
CREATE TRIGGER calculate_duration_hours_trigger
    BEFORE INSERT OR UPDATE ON delay_events
    FOR EACH ROW
    EXECUTE FUNCTION calculate_duration_hours();