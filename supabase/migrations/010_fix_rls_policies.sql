-- Fix RLS policies to allow authenticated users to create, update, and delete their own data

-- Drop existing policies if they exist (to recreate them)
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can create own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

DROP POLICY IF EXISTS "Users can view own delay_events" ON delay_events;
DROP POLICY IF EXISTS "Users can create delay_events" ON delay_events;
DROP POLICY IF EXISTS "Users can update own delay_events" ON delay_events;
DROP POLICY IF EXISTS "Users can delete own delay_events" ON delay_events;

DROP POLICY IF EXISTS "Users can view own weather_readings" ON weather_readings;
DROP POLICY IF EXISTS "Users can create weather_readings" ON weather_readings;
DROP POLICY IF EXISTS "Users can update own weather_readings" ON weather_readings;
DROP POLICY IF EXISTS "Users can delete own weather_readings" ON weather_readings;

DROP POLICY IF EXISTS "Users can view own crew_members" ON crew_members;
DROP POLICY IF EXISTS "Users can create own crew_members" ON crew_members;
DROP POLICY IF EXISTS "Users can update own crew_members" ON crew_members;
DROP POLICY IF EXISTS "Users can delete own crew_members" ON crew_members;

DROP POLICY IF EXISTS "Users can view own equipment" ON equipment;
DROP POLICY IF EXISTS "Users can create own equipment" ON equipment;
DROP POLICY IF EXISTS "Users can update own equipment" ON equipment;
DROP POLICY IF EXISTS "Users can delete own equipment" ON equipment;

DROP POLICY IF EXISTS "Users can view project_crew_assignments" ON project_crew_assignments;
DROP POLICY IF EXISTS "Users can create project_crew_assignments" ON project_crew_assignments;
DROP POLICY IF EXISTS "Users can update project_crew_assignments" ON project_crew_assignments;
DROP POLICY IF EXISTS "Users can delete project_crew_assignments" ON project_crew_assignments;

DROP POLICY IF EXISTS "Users can view project_equipment_assignments" ON project_equipment_assignments;
DROP POLICY IF EXISTS "Users can create project_equipment_assignments" ON project_equipment_assignments;
DROP POLICY IF EXISTS "Users can update project_equipment_assignments" ON project_equipment_assignments;
DROP POLICY IF EXISTS "Users can delete project_equipment_assignments" ON project_equipment_assignments;

DROP POLICY IF EXISTS "Users can view weather_threshold_templates" ON weather_threshold_templates;
DROP POLICY IF EXISTS "Users can create weather_threshold_templates" ON weather_threshold_templates;
DROP POLICY IF EXISTS "Users can update own weather_threshold_templates" ON weather_threshold_templates;
DROP POLICY IF EXISTS "Users can delete own weather_threshold_templates" ON weather_threshold_templates;

DROP POLICY IF EXISTS "Users can view reports" ON reports;
DROP POLICY IF EXISTS "Users can create reports" ON reports;
DROP POLICY IF EXISTS "Users can update reports" ON reports;
DROP POLICY IF EXISTS "Users can delete reports" ON reports;

-- Projects policies
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- Delay events policies
CREATE POLICY "Users can view own delay_events" ON delay_events
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create delay_events" ON delay_events
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own delay_events" ON delay_events
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own delay_events" ON delay_events
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Weather readings policies
CREATE POLICY "Users can view own weather_readings" ON weather_readings
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create weather_readings" ON weather_readings
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own weather_readings" ON weather_readings
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own weather_readings" ON weather_readings
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Crew members policies
CREATE POLICY "Users can view own crew_members" ON crew_members
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own crew_members" ON crew_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own crew_members" ON crew_members
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own crew_members" ON crew_members
    FOR DELETE USING (auth.uid() = user_id);

-- Equipment policies
CREATE POLICY "Users can view own equipment" ON equipment
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own equipment" ON equipment
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own equipment" ON equipment
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own equipment" ON equipment
    FOR DELETE USING (auth.uid() = user_id);

-- Project crew assignments policies
CREATE POLICY "Users can view project_crew_assignments" ON project_crew_assignments
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create project_crew_assignments" ON project_crew_assignments
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update project_crew_assignments" ON project_crew_assignments
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete project_crew_assignments" ON project_crew_assignments
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Project equipment assignments policies
CREATE POLICY "Users can view project_equipment_assignments" ON project_equipment_assignments
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create project_equipment_assignments" ON project_equipment_assignments
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update project_equipment_assignments" ON project_equipment_assignments
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete project_equipment_assignments" ON project_equipment_assignments
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Weather threshold templates policies
CREATE POLICY "Users can view weather_threshold_templates" ON weather_threshold_templates
    FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can create weather_threshold_templates" ON weather_threshold_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weather_threshold_templates" ON weather_threshold_templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own weather_threshold_templates" ON weather_threshold_templates
    FOR DELETE USING (auth.uid() = user_id);

-- Reports policies
CREATE POLICY "Users can view reports" ON reports
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create reports" ON reports
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update reports" ON reports
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete reports" ON reports
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Company settings policies (if not already created)
DROP POLICY IF EXISTS "Users can view own company_settings" ON company_settings;
DROP POLICY IF EXISTS "Users can create own company_settings" ON company_settings;
DROP POLICY IF EXISTS "Users can update own company_settings" ON company_settings;

CREATE POLICY "Users can view own company_settings" ON company_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own company_settings" ON company_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own company_settings" ON company_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Photos policies (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'photos') THEN
        DROP POLICY IF EXISTS "Users can view photos" ON photos;
        DROP POLICY IF EXISTS "Users can create photos" ON photos;
        DROP POLICY IF EXISTS "Users can update photos" ON photos;
        DROP POLICY IF EXISTS "Users can delete photos" ON photos;

        CREATE POLICY "Users can view photos" ON photos
            FOR SELECT USING (
                delay_event_id IN (
                    SELECT id FROM delay_events WHERE project_id IN (
                        SELECT id FROM projects WHERE user_id = auth.uid()
                    )
                )
            );

        CREATE POLICY "Users can create photos" ON photos
            FOR INSERT WITH CHECK (
                delay_event_id IN (
                    SELECT id FROM delay_events WHERE project_id IN (
                        SELECT id FROM projects WHERE user_id = auth.uid()
                    )
                )
            );

        CREATE POLICY "Users can update photos" ON photos
            FOR UPDATE USING (
                delay_event_id IN (
                    SELECT id FROM delay_events WHERE project_id IN (
                        SELECT id FROM projects WHERE user_id = auth.uid()
                    )
                )
            );

        CREATE POLICY "Users can delete photos" ON photos
            FOR DELETE USING (
                delay_event_id IN (
                    SELECT id FROM delay_events WHERE project_id IN (
                        SELECT id FROM projects WHERE user_id = auth.uid()
                    )
                )
            );
    END IF;
END $$;