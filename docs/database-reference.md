# WeatherProof Database Reference & Data Dictionary

**IMPORTANT: This is the master reference for the WeatherProof database. All sessions should refer to this document.**

## Quick Reference

### Supabase Connection
- **Project URL**: https://kxbqvacdtsddgnxtdkgp.supabase.co
- **Dashboard**: https://supabase.com/dashboard/project/kxbqvacdtsddgnxtdkgp
- **Anon Key**: Set in environment variable `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Demo Account
- **Email**: demo@weatherproof.app
- **Password**: Qu!ckWeather$$Demo8

## Database Overview

WeatherProof uses PostgreSQL via Supabase with Row Level Security (RLS) enabled on all tables. The database tracks construction projects, weather conditions, work delays, and generates insurance claims.

## Core Business Logic

### How Delay Cost Calculation Works

1. **When a weather delay occurs:**
   - Document start/end times
   - Record specific weather conditions
   - Select affected crew members from `project_crew_assignments`
   - Select idled equipment from `project_equipment_assignments`

2. **Cost components:**
   - **Labor Cost** = Σ(crew_hours × hourly_rate × burden_rate)
   - **Equipment Cost** = Σ(equipment_hours × standby_rate)
   - **Overhead Cost** = daily_overhead × (duration_hours / 8)
   - **Total Cost** = Labor + Equipment + Overhead + Materials Damage

3. **Insurance requirements:**
   - Must track SPECIFIC crew/equipment (not just counts)
   - Must use standby rates for equipment (not operational)
   - Must include burden rates for accurate labor costs
   - Must verify weather within 10 miles of site

## Table Structure

### 1. projects
**Purpose**: Master table for construction projects
**Key Fields**:
- `id` (UUID) - Primary key
- `user_id` (UUID) - Owner reference
- `insurance_carrier`, `insurance_policy_number` - For claims
- `contract_number`, `contract_value` - Required by insurance
- `weather_thresholds` (JSONB) - Triggers for delays

**Business Rules**:
- One project can have many delays, crew, equipment
- Insurance fields required for claim generation
- Weather thresholds determine when to create alerts

### 2. delay_events
**Purpose**: Documents weather-related work stoppages
**Key Fields**:
- `id` (UUID) - Primary key
- `project_id` (UUID) - Which project
- `start_time`, `end_time` (TIMESTAMPTZ) - When delay occurred
- `duration_hours` (DECIMAL) - Auto-calculated
- `weather_condition` - What caused the delay
- `verified` (BOOLEAN) - NOAA verification status
- `total_cost` (DECIMAL) - Sum of all costs

**Business Rules**:
- Must be verified with NOAA data to be valid for insurance
- Duration auto-calculated from start/end times
- Links to specific crew/equipment via relationship tables

### 3. delay_crew_affected
**Purpose**: Tracks WHICH crew members were affected (required for insurance)
**Key Fields**:
- `delay_event_id` (UUID) - Which delay
- `crew_member_id` (UUID) - Which crew member
- `hours_idled` (DECIMAL) - How long they were idle
- `hourly_rate` (DECIMAL) - Their rate at time of delay
- `burden_rate` (DECIMAL) - Multiplier for benefits/taxes (default 1.35)
- `total_cost` (DECIMAL) - Auto-calculated: hours × rate × burden

**Business Rules**:
- Insurance requires specific names, not just counts
- Burden rate accounts for benefits, taxes, insurance
- Rate captured at time of delay (not current rate)

### 4. delay_equipment_affected
**Purpose**: Tracks WHICH equipment was idled (required for insurance)
**Key Fields**:
- `delay_event_id` (UUID) - Which delay
- `equipment_id` (UUID) - Which equipment
- `hours_idled` (DECIMAL) - How long idle
- `standby_rate` (DECIMAL) - Idle rate (NOT operational rate)
- `is_rented` (BOOLEAN) - Affects cost calculation
- `total_cost` (DECIMAL) - Auto-calculated: hours × standby_rate

**Business Rules**:
- Must use standby rate (typically 50-70% of operational)
- Rented equipment may have different rates
- Insurance wants equipment list, not just total cost

### 5. weather_readings
**Purpose**: Stores verified weather data from NOAA
**Key Fields**:
- `project_id` (UUID) - Which project location
- `timestamp` (TIMESTAMPTZ) - When reading taken
- `temperature`, `wind_speed`, `precipitation` - Core metrics
- `source` - Where data came from (NOAA)
- `source_station_id` - Which weather station
- `raw_data` (JSONB) - Original API response

**Business Rules**:
- Must be from station within 10 miles of project
- NOAA data is legally accepted by insurance
- Raw data stored for audit trail

### 6. crew_members
**Purpose**: Master list of all crew members
**Key Fields**:
- `id` (UUID) - Primary key
- `user_id` (UUID) - Company owner
- `name` - Full name
- `hourly_rate` - Default rate
- `burden_rate` - Benefits multiplier (default 1.35)
- `trade` - Carpenter, Electrician, etc.

**Relationships**:
- Assigned to projects via `project_crew_assignments`
- Tracked in delays via `delay_crew_affected`

### 7. equipment
**Purpose**: Master list of all equipment
**Key Fields**:
- `id` (UUID) - Primary key
- `user_id` (UUID) - Company owner
- `name` - Equipment identifier
- `hourly_rate` - Operational rate
- `standby_rate` - Idle rate (for delays)
- `is_rented` - Affects costing

**Relationships**:
- Assigned to projects via `project_equipment_assignments`
- Tracked in delays via `delay_equipment_affected`

### 8. reports
**Purpose**: Generated insurance claim documents
**Key Fields**:
- `project_id` (UUID) - Which project
- `report_type` - insurance_claim, daily_log, etc.
- `period_start/end` - Date range covered
- `status` - DRAFT, SUBMITTED, APPROVED, DENIED
- `insurance_claim_number` - Tracking number
- `report_data` (JSONB) - All delay IDs included

**Business Rules**:
- Aggregates multiple delays into single claim
- Must include verified weather data
- PDF generated from this data

### 9. project_crew_assignments
**Purpose**: Links crew to specific projects
**Key Fields**:
- `project_id`, `crew_member_id` - The link
- `hourly_rate` - Can override crew member's default rate
- `start_date`, `end_date` - Assignment period

### 10. project_equipment_assignments
**Purpose**: Links equipment to specific projects
**Key Fields**:
- `project_id`, `equipment_id` - The link
- `daily_rate` - Can override equipment's default rate
- `start_date`, `end_date` - Assignment period

## Critical Relationships

```
projects (1) ─┬─ (∞) delay_events (1) ─┬─ (∞) delay_crew_affected ──── (1) crew_members
              ├─ (∞) weather_readings   └─ (∞) delay_equipment_affected ─ (1) equipment
              ├─ (∞) reports
              ├─ (∞) project_crew_assignments ──── (1) crew_members
              └─ (∞) project_equipment_assignments ─ (1) equipment
```

## Required Data for Insurance Claims

### Must Have:
1. **Project**: contract_number, insurance_policy_number, carrier
2. **Delay**: start/end times, specific weather measurements
3. **Crew**: SPECIFIC members affected, individual hours/rates/burden
4. **Equipment**: SPECIFIC equipment idled, standby rates
5. **Weather**: NOAA verification within 10 miles
6. **Photos**: Timestamped site conditions

### Cost Formula:
```sql
Total Delay Cost = 
  SUM(crew_hours × hourly_rate × burden_rate) +     -- Labor with burden
  SUM(equipment_hours × standby_rate) +              -- Equipment idle cost
  (daily_overhead × (total_hours / 8)) +             -- Overhead allocation
  materials_damage_cost                              -- If applicable
```

## Common Queries

### Get all delays for a project with costs:
```sql
SELECT 
  de.*,
  dcs.crew_cost,
  dcs.equipment_cost,
  dcs.total_calculated_cost
FROM delay_events de
LEFT JOIN delay_cost_summary dcs ON dcs.id = de.id
WHERE de.project_id = 'PROJECT_ID'
ORDER BY de.start_time DESC;
```

### Get crew affected by a delay:
```sql
SELECT 
  cm.name,
  cm.trade,
  dca.hours_idled,
  dca.hourly_rate,
  dca.burden_rate,
  dca.total_cost
FROM delay_crew_affected dca
JOIN crew_members cm ON cm.id = dca.crew_member_id
WHERE dca.delay_event_id = 'DELAY_ID';
```

### Calculate project delay summary:
```sql
SELECT 
  COUNT(DISTINCT de.id) as total_delays,
  SUM(de.duration_hours) as total_hours,
  SUM(dcs.total_calculated_cost) as total_cost
FROM delay_events de
LEFT JOIN delay_cost_summary dcs ON dcs.id = de.id
WHERE de.project_id = 'PROJECT_ID'
  AND de.verified = true;
```

## RLS (Row Level Security) Rules

All tables enforce user isolation:
- Direct ownership: `auth.uid() = user_id`
- Project-based: User owns the project
- Cascade: Delay data accessible if user owns project

## Migration History

1. `009_add_insurance_requirements_essential.sql` - Added insurance fields to projects
2. `010_fix_rls_policies.sql` - Fixed write permissions
3. `011_add_missing_weather_columns.sql` - Added wind_direction, etc.
4. `012_add_delay_crew_equipment_tracking.sql` - Added specific crew/equipment tracking
5. `013_add_missing_delay_columns.sql` - Added duration_hours, labor_hours_lost

## Data Entry Flow

1. **Create Project** → Set insurance info, weather thresholds
2. **Assign Crew/Equipment** → Link resources to project
3. **Weather Delay Occurs** → Document delay with start time
4. **Select Affected Resources** → Pick specific crew/equipment
5. **End Delay** → Record end time, verify with NOAA
6. **Generate Report** → Aggregate delays for insurance claim

## Validation Rules

- Weather station must be within 10 miles
- Delay must have end_time to calculate costs
- Crew/equipment must be assigned to project first
- Burden rate typically 1.35 (35% above base wage)
- Standby rate typically 50-70% of operational rate

## File Storage

**Supabase Storage Bucket**: `photos`
- Path: `{user_id}/{project_id}/{delay_event_id}/{filename}`
- Used for delay documentation photos
- Must include timestamp metadata

---

**Last Updated**: January 2025
**Version**: 1.0
**Maintainer**: WeatherProof Development Team