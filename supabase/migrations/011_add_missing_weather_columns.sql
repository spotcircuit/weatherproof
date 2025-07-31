-- Add missing columns to weather_readings table
-- This migration adds columns that were in the schema but missing from the actual database

-- Add wind_direction column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'weather_readings' 
        AND column_name = 'wind_direction'
    ) THEN
        ALTER TABLE weather_readings ADD COLUMN wind_direction INTEGER;
    END IF;
END $$;

-- Also check and add other potentially missing columns
DO $$
BEGIN
    -- visibility
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'weather_readings' 
        AND column_name = 'visibility'
    ) THEN
        ALTER TABLE weather_readings ADD COLUMN visibility DECIMAL(5,2);
    END IF;

    -- pressure
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'weather_readings' 
        AND column_name = 'pressure'
    ) THEN
        ALTER TABLE weather_readings ADD COLUMN pressure DECIMAL(6,2);
    END IF;

    -- uv_index
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'weather_readings' 
        AND column_name = 'uv_index'
    ) THEN
        ALTER TABLE weather_readings ADD COLUMN uv_index INTEGER;
    END IF;

    -- feels_like
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'weather_readings' 
        AND column_name = 'feels_like'
    ) THEN
        ALTER TABLE weather_readings ADD COLUMN feels_like DECIMAL(5,2);
    END IF;

    -- dew_point
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'weather_readings' 
        AND column_name = 'dew_point'
    ) THEN
        ALTER TABLE weather_readings ADD COLUMN dew_point DECIMAL(5,2);
    END IF;

    -- cloud_cover
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'weather_readings' 
        AND column_name = 'cloud_cover'
    ) THEN
        ALTER TABLE weather_readings ADD COLUMN cloud_cover INTEGER;
    END IF;

    -- lightning_detected
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'weather_readings' 
        AND column_name = 'lightning_detected'
    ) THEN
        ALTER TABLE weather_readings ADD COLUMN lightning_detected BOOLEAN DEFAULT false;
    END IF;

    -- raw_data
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'weather_readings' 
        AND column_name = 'raw_data'
    ) THEN
        ALTER TABLE weather_readings ADD COLUMN raw_data JSONB DEFAULT '{}';
    END IF;

    -- source_station_id
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'weather_readings' 
        AND column_name = 'source_station_id'
    ) THEN
        ALTER TABLE weather_readings ADD COLUMN source_station_id VARCHAR(100);
    END IF;
END $$;

-- Add comment to describe wind_direction values
COMMENT ON COLUMN weather_readings.wind_direction IS 'Wind direction in degrees (0-359, where 0 = North, 90 = East, 180 = South, 270 = West)';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_weather_readings_wind ON weather_readings(project_id, wind_speed, wind_direction);