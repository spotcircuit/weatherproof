-- Add missing INSERT policy for users table to allow signup
CREATE POLICY "Users can insert own profile during signup" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Also add a policy for updating delay events and weather readings
CREATE POLICY "Users can update delay events for own projects" ON delay_events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = delay_events.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert delay events for own projects" ON delay_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = delay_events.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Allow weather reading inserts for own projects
CREATE POLICY "Users can insert weather readings for own projects" ON weather_readings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = weather_readings.project_id
      AND projects.user_id = auth.uid()
    )
  );