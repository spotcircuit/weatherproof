-- Seed data for WeatherProof testing
-- This creates sample projects, weather data, delays, and reports

-- First, create a test user (you'll need to replace this ID with your actual user ID after signup)
-- The user ID will come from Supabase Auth when you sign up

-- Sample projects (replace 'YOUR_USER_ID' with your actual user ID after signing up)
DO $$
DECLARE
    user_id uuid := 'YOUR_USER_ID'::uuid; -- Replace this after signup
    project1_id uuid := uuid_generate_v4();
    project2_id uuid := uuid_generate_v4();
    project3_id uuid := uuid_generate_v4();
BEGIN
    -- Only run if user exists
    IF EXISTS (SELECT 1 FROM users WHERE id = user_id) THEN
        
        -- Insert sample projects
        INSERT INTO projects (id, user_id, name, description, address, latitude, longitude, start_date, end_date, active, project_type, crew_size, hourly_rate, daily_overhead, weather_thresholds)
        VALUES 
        (
            project1_id,
            user_id,
            'Downtown Office Complex',
            'New 10-story office building construction in downtown area',
            '123 Main St, Richmond, VA 23219',
            37.5407,
            -77.4360,
            NOW() - INTERVAL '30 days',
            NOW() + INTERVAL '90 days',
            true,
            'commercial',
            25,
            65.00,
            2500.00,
            '{"wind_speed": 25, "precipitation": 0.25, "temperature_min": 35, "temperature_max": 95}'::jsonb
        ),
        (
            project2_id,
            user_id,
            'Suburban Housing Development',
            'Phase 2 of residential development - 50 single family homes',
            '456 Oak Lane, Henrico, VA 23229',
            37.6213,
            -77.5735,
            NOW() - INTERVAL '60 days',
            NOW() + INTERVAL '120 days',
            true,
            'residential',
            15,
            55.00,
            1500.00,
            '{"wind_speed": 30, "precipitation": 0.5, "temperature_min": 32, "temperature_max": 100}'::jsonb
        ),
        (
            project3_id,
            user_id,
            'Highway Bridge Repair',
            'I-95 bridge deck replacement project',
            'I-95 Mile Marker 82, Richmond, VA',
            37.5885,
            -77.4565,
            NOW() - INTERVAL '14 days',
            NOW() + INTERVAL '45 days',
            true,
            'infrastructure',
            20,
            75.00,
            3000.00,
            '{"wind_speed": 35, "precipitation": 0.1, "temperature_min": 40, "temperature_max": 90}'::jsonb
        );

        -- Insert sample weather readings for the last 7 days
        INSERT INTO weather_readings (project_id, timestamp, temperature, wind_speed, precipitation, humidity, conditions, source, raw_data)
        SELECT 
            p.id,
            generate_series(
                NOW() - INTERVAL '7 days',
                NOW(),
                INTERVAL '3 hours'
            ) as timestamp,
            -- Simulate realistic temperature variations
            65 + (20 * sin(extract(hour from generate_series(NOW() - INTERVAL '7 days', NOW(), INTERVAL '3 hours'))::numeric * 3.14159 / 12)) + (random() * 10 - 5),
            -- Wind speed with some variation
            10 + (random() * 15),
            -- Occasional precipitation
            CASE WHEN random() < 0.2 THEN random() * 0.5 ELSE 0 END,
            -- Humidity
            50 + (random() * 30),
            -- Weather conditions
            CASE 
                WHEN random() < 0.1 THEN 'Rainy'
                WHEN random() < 0.2 THEN 'Cloudy'
                WHEN random() < 0.3 THEN 'Partly Cloudy'
                ELSE 'Clear'
            END,
            'NOAA',
            '{"station": "KRIC", "raw": "sample_data"}'::jsonb
        FROM projects p
        WHERE p.id IN (project1_id, project2_id, project3_id);

        -- Insert some delay events
        INSERT INTO delay_events (project_id, start_time, end_time, weather_condition, threshold_violated, crew_size, labor_hours_lost, total_cost, verified, notes)
        VALUES
        -- Project 1 delays
        (
            project1_id,
            NOW() - INTERVAL '5 days 8 hours',
            NOW() - INTERVAL '5 days 2 hours',
            'Heavy Rain - 1.2 inches',
            '{"precipitation": 1.2}'::jsonb,
            25,
            6,
            (25 * 65 * 6) + (6/8 * 2500),
            true,
            'Work stopped due to heavy rain. Concrete pour postponed.'
        ),
        (
            project1_id,
            NOW() - INTERVAL '3 days 9 hours',
            NOW() - INTERVAL '3 days 5 hours',
            'High Winds - 35 mph gusts',
            '{"wind_speed": 35}'::jsonb,
            25,
            4,
            (25 * 65 * 4) + (4/8 * 2500),
            true,
            'Crane operations suspended due to high winds.'
        ),
        -- Project 2 delay
        (
            project2_id,
            NOW() - INTERVAL '4 days 7 hours',
            NOW() - INTERVAL '4 days 4 hours',
            'Freezing Temperature - 28°F',
            '{"temperature_min": 28}'::jsonb,
            15,
            3,
            (15 * 55 * 3) + (3/8 * 1500),
            true,
            'Concrete work halted due to freezing temperatures.'
        ),
        -- Active delay on Project 3
        (
            project3_id,
            NOW() - INTERVAL '2 hours',
            NULL, -- Still active
            'Heavy Rain - 0.8 inches/hour',
            '{"precipitation": 0.8}'::jsonb,
            20,
            NULL,
            NULL,
            false,
            'Bridge deck work suspended. Monitoring conditions.'
        );

        -- Insert a sample report
        INSERT INTO reports (project_id, user_id, report_type, period_start, period_end, total_delay_hours, total_cost, status, metadata)
        VALUES
        (
            project1_id,
            user_id,
            'INSURANCE_CLAIM',
            NOW() - INTERVAL '7 days',
            NOW(),
            10, -- 6 + 4 hours from delays
            (25 * 65 * 10) + (10/8 * 2500),
            'COMPLETED',
            '{"claim_number": "WP-2024-001", "insurer": "Sample Insurance Co", "policy_number": "POL-123456"}'::jsonb
        );

        RAISE NOTICE 'Seed data created successfully!';
        RAISE NOTICE 'Projects created: %, %, %', project1_id, project2_id, project3_id;
    ELSE
        RAISE NOTICE 'User ID not found. Please update the user_id variable with your actual user ID after signing up.';
    END IF;
END $$;

-- Note: After you sign up, you need to:
-- 1. Get your user ID from the users table or Supabase Auth
-- 2. Replace 'YOUR_USER_ID' in this file with your actual user ID
-- 3. Run this seed file in the Supabase SQL editor