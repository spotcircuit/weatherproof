# WeatherProof Database Schema Documentation

## Overview
WeatherProof uses Supabase (PostgreSQL) with comprehensive tables for tracking construction projects, weather data, delays, and associated costs.

## Core Tables

### 1. **users** (Supabase Auth)
- Managed by Supabase Auth
- Contains user authentication data

### 2. **projects**
Main project tracking table.

```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- name: VARCHAR(255)
- address: TEXT
- start_date: DATE
- end_date: DATE (nullable)
- active: BOOLEAN
- crew_size: INTEGER
- hourly_rate: DECIMAL(10,2)
- daily_overhead: DECIMAL(10,2)
- project_type: VARCHAR(100)
- description: TEXT
- weather_thresholds: JSONB
- weather_preferences: JSONB
- project_manager: VARCHAR(255)
- client_name: VARCHAR(255)
- client_email: VARCHAR(255)
- client_phone: VARCHAR(50)
- contract_value: DECIMAL(15,2)
- insurance_carrier: VARCHAR(255)
- insurance_policy_number: VARCHAR(100)
- site_conditions: JSONB
- critical_activities: JSONB
- subcontractors: JSONB
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### 3. **weather_readings**
Stores actual weather data from various sources.

```sql
- id: UUID (primary key)
- project_id: UUID (references projects)
- timestamp: TIMESTAMPTZ
- temperature: DECIMAL(10,2)
- humidity: DECIMAL(10,2)
- wind_speed: DECIMAL(10,2)
- wind_direction: INTEGER
- precipitation: DECIMAL(10,2)
- conditions: TEXT
- source: VARCHAR(50) (NOAA, Weather Underground, etc.)
- source_station_id: VARCHAR(100)
- visibility: DECIMAL(10,2)
- pressure: DECIMAL(10,2)
- uv_index: INTEGER
- feels_like: DECIMAL(10,2)
- dew_point: DECIMAL(10,2)
- cloud_cover: INTEGER
- lightning_detected: BOOLEAN
- raw_data: JSONB
```

### 4. **delay_events**
Tracks weather-related work delays.

```sql
- id: UUID (primary key)
- project_id: UUID (references projects)
- start_time: TIMESTAMPTZ
- end_time: TIMESTAMPTZ (nullable)
- weather_condition: VARCHAR(255)
- delay_reason: TEXT
- crew_size: INTEGER
- hourly_rate: DECIMAL(10,2)
- duration_hours: DECIMAL(10,2)
- labor_hours_lost: DECIMAL(10,2)
- labor_cost: DECIMAL(10,2)
- equipment_cost: DECIMAL(10,2)
- overhead_cost: DECIMAL(10,2)
- total_cost: DECIMAL(10,2)
- verified: BOOLEAN
- delay_type: VARCHAR(50)
- crew_affected: INTEGER
- equipment_idle_cost: DECIMAL(10,2)
- materials_damaged: BOOLEAN
- materials_damage_cost: DECIMAL(10,2)
- photos: JSONB
- supervisor_notes: TEXT
- verified_by: VARCHAR(255)
- verified_at: TIMESTAMPTZ
- noaa_report_url: TEXT
- created_at: TIMESTAMPTZ
```

### 5. **alerts**
Weather alerts and notifications.

```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- project_id: UUID (references projects)
- alert_type: VARCHAR(100)
- severity: VARCHAR(50) (CRITICAL, HIGH, MEDIUM, LOW)
- message: TEXT
- threshold_exceeded: JSONB
- read: BOOLEAN
- read_at: TIMESTAMPTZ
- created_at: TIMESTAMPTZ
```

### 6. **reports**
Generated weather delay reports for insurance claims.

```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- project_id: UUID (references projects)
- report_type: VARCHAR(100)
- period_start: DATE
- period_end: DATE
- total_delay_hours: DECIMAL(10,2)
- total_cost: DECIMAL(10,2)
- report_data: JSONB
- report_status: VARCHAR(50) (draft, final, submitted)
- submitted_to: VARCHAR(255)
- submitted_at: TIMESTAMPTZ
- insurance_claim_number: VARCHAR(100)
- supporting_documents: JSONB
- signatures: JSONB
- certified_by: VARCHAR(255)
- certified_at: TIMESTAMPTZ
- created_at: TIMESTAMPTZ
```

## Additional Feature Tables

### 7. **company_settings**
Company-wide configuration and preferences.

```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users, unique)
- company_name: VARCHAR(255)
- company_logo: TEXT
- company_address: TEXT
- company_phone: VARCHAR(50)
- company_email: VARCHAR(255)
- license_number: VARCHAR(100)
- tax_id: VARCHAR(50)
- website: VARCHAR(255)
- default_hourly_rate: DECIMAL(10,2)
- default_crew_size: INTEGER
- weather_api_keys: JSONB
- notification_settings: JSONB
```

### 8. **weather_threshold_templates**
Reusable weather threshold configurations.

```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- name: VARCHAR(255)
- description: TEXT
- thresholds: JSONB
- work_types: JSONB
```

### 9. **crew_members**
Track individual crew members.

```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- name: VARCHAR(255)
- role: VARCHAR(100)
- phone: VARCHAR(50)
- email: VARCHAR(255)
- hourly_rate: DECIMAL(10,2)
- emergency_contact: VARCHAR(255)
- emergency_phone: VARCHAR(50)
- certifications: JSONB
- active: BOOLEAN
```

### 10. **equipment**
Construction equipment inventory.

```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- name: VARCHAR(255)
- type: VARCHAR(100)
- daily_rate: DECIMAL(10,2)
- hourly_rate: DECIMAL(10,2)
- description: TEXT
- serial_number: VARCHAR(255)
- purchase_date: DATE
- active: BOOLEAN
```

### 11. **project_crew_assignments**
Links crew members to projects.

```sql
- id: UUID (primary key)
- project_id: UUID (references projects)
- crew_member_id: UUID (references crew_members)
- role: VARCHAR(100)
- start_date: DATE
- end_date: DATE (nullable)
- hourly_rate: DECIMAL(10,2)
```

### 12. **project_equipment_assignments**
Links equipment to projects.

```sql
- id: UUID (primary key)
- project_id: UUID (references projects)
- equipment_id: UUID (references equipment)
- start_date: DATE
- end_date: DATE (nullable)
- daily_rate: DECIMAL(10,2)
```

### 13. **document_templates**
Customizable document templates.

```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- name: VARCHAR(255)
- type: VARCHAR(50)
- content: TEXT
- variables: JSONB
- active: BOOLEAN
```

### 14. **photos**
Photo documentation for delays and site conditions.

```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- project_id: UUID (references projects, nullable)
- delay_event_id: UUID (references delay_events, nullable)
- url: TEXT
- thumbnail_url: TEXT
- filename: VARCHAR(255)
- caption: TEXT
- metadata: JSONB
- taken_at: TIMESTAMPTZ
- uploaded_at: TIMESTAMPTZ
```

### 15. **integrations**
Third-party integrations configuration.

```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- type: VARCHAR(50) (crm, accounting, weather)
- name: VARCHAR(255)
- config: JSONB
- active: BOOLEAN
- last_sync: TIMESTAMPTZ
```

### 16. **weather_forecasts**
Cached weather forecast data.

```sql
- id: UUID (primary key)
- project_id: UUID (references projects)
- forecast_date: DATE
- source: VARCHAR(50)
- forecast_data: JSONB
- created_at: TIMESTAMPTZ
```

## Indexes

Key indexes for performance:
- `idx_weather_readings_project_timestamp` on weather_readings(project_id, timestamp DESC)
- `idx_delay_events_project_start` on delay_events(project_id, start_time DESC)
- `idx_photos_project` on photos(project_id)
- `idx_photos_delay` on photos(delay_event_id)
- `idx_weather_forecasts_project_date` on weather_forecasts(project_id, forecast_date)

## Row Level Security (RLS)

All tables have RLS enabled with policies ensuring users can only access their own data:
- Direct ownership check: `auth.uid() = user_id`
- Project ownership check: `EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())`

## JSONB Field Structures

### weather_thresholds (in projects table)
```json
{
  "wind_speed_mph": 25,
  "precipitation_inches": 0.25,
  "min_temp": 40,
  "max_temp": 95,
  "humidity_max": 90,
  "visibility_miles": 0.5,
  "lightning_radius_miles": 10
}
```

### weather_preferences (in projects table)
```json
{
  "rain_delay": true,
  "wind_delay": true,
  "temp_delay": true,
  "lightning_delay": true
}
```

### notification_settings (in company_settings table)
```json
{
  "email_alerts": true,
  "sms_alerts": false,
  "daily_summary": true,
  "report_ready": true,
  "critical_alerts_only": false,
  "advance_warning_hours": 4,
  "quiet_hours_start": "22:00",
  "quiet_hours_end": "06:00"
}
```

## Data Relationships

1. **User → Projects**: One-to-many
2. **Project → Weather Readings**: One-to-many
3. **Project → Delay Events**: One-to-many
4. **Project → Reports**: One-to-many
5. **Project → Crew Assignments**: One-to-many
6. **Project → Equipment Assignments**: One-to-many
7. **Delay Event → Photos**: One-to-many
8. **User → Crew Members**: One-to-many
9. **User → Equipment**: One-to-many

## Usage Notes

1. **Weather Data Collection**: Weather readings should be collected every 1-6 hours from multiple sources for accuracy.
2. **Delay Verification**: Delays should be verified within 24-48 hours with supporting documentation.
3. **Cost Calculations**: Total costs include labor, equipment idle time, overhead, and any material damage.
4. **Report Generation**: Reports can aggregate multiple delay events over a time period for insurance claims.
5. **Photo Documentation**: Photos should be timestamped and geotagged when possible.
6. **Integration Sync**: Third-party integrations should sync on configurable intervals to avoid API rate limits.