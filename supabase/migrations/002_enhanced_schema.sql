-- Add PostGIS extension for geospatial features
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Add new project types
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'SUBCONTRACTOR';

-- Enhance projects table with more fields
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS crew_size INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2) DEFAULT 50.00,
ADD COLUMN IF NOT EXISTS daily_overhead DECIMAL(10,2) DEFAULT 500.00,
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS external_source TEXT,
ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT, 4326),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Update location when lat/lng changes
CREATE OR REPLACE FUNCTION update_project_location()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_location_trigger
    BEFORE INSERT OR UPDATE OF latitude, longitude ON projects
    FOR EACH ROW EXECUTE FUNCTION update_project_location();

-- Create weather stations table for caching
CREATE TABLE IF NOT EXISTS weather_stations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    location GEOGRAPHY(POINT, 4326),
    source TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weather_stations_location ON weather_stations USING GIST(location);

-- Add station info to weather readings
ALTER TABLE weather_readings
ADD COLUMN IF NOT EXISTS station_id TEXT,
ADD COLUMN IF NOT EXISTS station_distance DECIMAL(5,2);

-- Create threshold templates table
CREATE TABLE IF NOT EXISTS threshold_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    project_type TEXT NOT NULL,
    thresholds JSONB NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(project_type, is_default) WHERE is_default = true
);

-- Insert default threshold templates
INSERT INTO threshold_templates (name, project_type, thresholds, description, is_default) VALUES
('Roofing Standards', 'roofing', '{
    "wind_speed": 25,
    "precipitation": 0.1,
    "temperature_min": 40,
    "temperature_max": 95
}', 'Standard thresholds for roofing work', true),

('Concrete Standards', 'concrete', '{
    "wind_speed": 30,
    "precipitation": 0.25,
    "temperature_min": 40,
    "temperature_max": 90,
    "cure_time_hours": 24
}', 'Standard thresholds for concrete work', true),

('Framing Standards', 'framing', '{
    "wind_speed": 35,
    "precipitation": 0.5,
    "temperature_min": 20,
    "temperature_max": 100
}', 'Standard thresholds for framing work', true),

('Painting Standards', 'painting', '{
    "wind_speed": 20,
    "precipitation": 0,
    "temperature_min": 50,
    "temperature_max": 90,
    "humidity_max": 85
}', 'Standard thresholds for exterior painting', true)
ON CONFLICT DO NOTHING;

-- Add insurance fields to reports
ALTER TABLE reports
ADD COLUMN IF NOT EXISTS claim_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS policy_number TEXT,
ADD COLUMN IF NOT EXISTS insurer_name TEXT,
ADD COLUMN IF NOT EXISTS csv_url TEXT,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Add cost breakdown to delay events
ALTER TABLE delay_events
ADD COLUMN IF NOT EXISTS equipment_cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS overhead_cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2);

-- Create import logs table
CREATE TABLE IF NOT EXISTS import_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    import_type TEXT NOT NULL, -- 'csv', 'servicetitan', 'quickbooks', etc.
    file_name TEXT,
    total_rows INTEGER,
    successful_rows INTEGER,
    failed_rows INTEGER,
    errors JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create webhook logs for n8n integration
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID REFERENCES alerts(id),
    webhook_url TEXT NOT NULL,
    payload JSONB NOT NULL,
    response_status INTEGER,
    response_body JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to find nearest weather station
CREATE OR REPLACE FUNCTION find_nearest_station(project_location geography, source_filter TEXT DEFAULT NULL)
RETURNS TABLE (
    station_id TEXT,
    distance_miles DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ws.station_id,
        ROUND((ST_Distance(project_location, ws.location) / 1609.34)::DECIMAL, 2) as distance_miles
    FROM weather_stations ws
    WHERE ws.active = true
    AND (source_filter IS NULL OR ws.source = source_filter)
    ORDER BY project_location <-> ws.location
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate delay costs
CREATE OR REPLACE FUNCTION calculate_delay_cost(
    p_crew_size INTEGER,
    p_hourly_rate DECIMAL,
    p_hours_lost DECIMAL,
    p_daily_overhead DECIMAL
)
RETURNS TABLE (
    labor_cost DECIMAL,
    overhead_cost DECIMAL,
    total_cost DECIMAL
) AS $$
BEGIN
    labor_cost := p_crew_size * p_hourly_rate * p_hours_lost;
    overhead_cost := (p_hours_lost / 8.0) * p_daily_overhead;
    total_cost := labor_cost + overhead_cost;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Create view for dashboard stats
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
    p.user_id,
    COUNT(DISTINCT p.id) as total_projects,
    COUNT(DISTINCT CASE WHEN p.active THEN p.id END) as active_projects,
    COUNT(DISTINCT de.id) as total_delays,
    COALESCE(SUM(de.total_cost), 0) as total_delay_cost,
    COALESCE(SUM(de.labor_hours_lost), 0) as total_hours_lost,
    COUNT(DISTINCT r.id) as total_reports,
    COUNT(DISTINCT CASE WHEN r.status = 'COMPLETED' THEN r.id END) as completed_reports
FROM projects p
LEFT JOIN delay_events de ON p.id = de.project_id
LEFT JOIN reports r ON p.id = r.project_id
GROUP BY p.user_id;

-- Add RLS policies for new tables
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE threshold_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own import logs" ON import_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own import logs" ON import_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view threshold templates" ON threshold_templates
    FOR SELECT USING (true);

CREATE POLICY "Webhook logs are system only" ON webhook_logs
    FOR ALL USING (false);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_external ON projects(external_id, external_source) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_delay_events_cost ON delay_events(project_id, total_cost) WHERE total_cost > 0;
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, created_at);
CREATE INDEX IF NOT EXISTS idx_import_logs_user ON import_logs(user_id, created_at DESC);