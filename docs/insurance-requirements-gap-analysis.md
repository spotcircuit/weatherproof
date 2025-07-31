# Insurance Requirements Gap Analysis

## Overview
This document compares the insurance claim requirements from `insurancereports.md` against the current WeatherProof implementation to identify gaps that need to be addressed.

## Current Status Summary

### ✅ What We Have
1. **Projects Table** - Most core fields present
2. **Weather Readings** - Good coverage of weather data
3. **Delay Events** - Basic structure exists
4. **Reports** - Report generation framework
5. **Crew & Equipment** - Assignment tracking implemented
6. **Photos** - Photo documentation table exists

### ❌ Critical Missing Fields for Insurance Claims

## 1. Projects Table Gaps

### Missing Fields:
- `contract_number` - Required by all insurance forms
- `general_contractor` - Required for subcontractor claims  
- `insurance_policy_number` - Critical for claim submission
- `liquidated_damages_per_day` - For schedule impact claims
- `contract_value` - Needed for percentage calculations

### Action Required:
```sql
ALTER TABLE projects ADD COLUMN contract_number VARCHAR(100);
ALTER TABLE projects ADD COLUMN general_contractor VARCHAR(255);
ALTER TABLE projects ADD COLUMN insurance_policy_number VARCHAR(100);
ALTER TABLE projects ADD COLUMN liquidated_damages_per_day DECIMAL(10,2);
ALTER TABLE projects ADD COLUMN contract_value DECIMAL(15,2);
```

## 2. Weather Delay Events Gaps

### Missing Fields:
- `total_days_delayed` - Insurance forms require integer days
- Specific weather type fields:
  - `precipitation_inches` (we only have generic precipitation)
  - `wind_speed_mph` (stored in weather_readings, not delay_events)
  - `temperature_high`/`temperature_low`
  - `snow_inches`
  - `has_lightning`
- `activities_affected` - Critical for insurance (currently array, need structured)
- `workers_idled` - Specific count required
- `equipment_idled` - List of equipment
- `subcontractors_affected` - List required

### Current vs Required:
```typescript
// Current DelayEvent
{
  weather_condition: string,
  affected_activities: string[],
  crew_size: number
}

// Insurance Required
{
  total_days_delayed: number,
  precipitation_inches: number,
  wind_speed_mph: number,
  temperature_high: number,
  temperature_low: number,
  snow_inches: number,
  has_lightning: boolean,
  activities_affected: {
    concrete_pour: boolean,
    excavation: boolean,
    roofing: boolean,
    exterior_work: boolean,
    crane_operations: boolean,
    other: string
  },
  workers_idled: number,
  equipment_idled: string[],
  subcontractors_affected: string[]
}
```

## 3. Cost Tracking Gaps

### Missing Structured Cost Fields:
Current implementation has generic cost fields, but insurance requires:
- `extended_general_conditions` - Separate from overhead
- `material_storage_protection` - Specific line item
- Breakdown by crew member with burden rates
- Equipment standby rates vs operational rates

### Missing Tables:
- `idle_crew_costs` - Track individual crew member idle time
- `idle_equipment_costs` - Track equipment-specific standby costs
- `critical_path_impacts` - Document schedule impacts

## 4. Documentation & Verification Gaps

### Missing Fields:
- Weather station distance verification (have station_id but not distance)
- `noaa_report_url` in delay_events (for direct NOAA links)
- Historical weather comparison data
- Sworn statement/certification fields

### Missing Features:
- Abnormal weather analysis (comparing to historical averages)
- Critical path impact documentation
- Automatic NOAA data correlation

## 5. Report Generation Gaps

### Current Report Fields Missing:
- `claim_number` - For tracking submissions
- `adjuster_name` - Contact info
- `settlement_amount` - For closed claims
- `denial_reason` - If claim denied
- Multiple signatures support (currently single signature)
- Notarization fields

## 6. Integration Requirements

### Not Currently Implemented:
1. **NOAA API Integration** - Direct weather verification
2. **Historical Weather Analysis** - 5-10 year averages
3. **Insurance System APIs** - Guidewire, Duck Creek
4. **Document Generation** - ACORD forms specifically

## Priority Implementation Plan

### Phase 1: Critical Database Updates (Immediate)
1. Add missing project fields (contract_number, policy_number, etc.)
2. Enhance delay_events with specific weather fields
3. Add structured cost tracking tables
4. Update reports table with insurance-specific fields

### Phase 2: Weather Data Enhancement (Week 1)
1. Implement NOAA API integration
2. Add weather station distance calculations
3. Create historical weather comparison
4. Add abnormal weather detection

### Phase 3: Documentation & Reporting (Week 2)
1. Create ACORD form templates
2. Add multi-signature support
3. Implement sworn statement generation
4. Add photo timestamp verification

### Phase 4: Integration & Automation (Week 3)
1. Insurance system API connections
2. Automated claim submission
3. Status tracking and updates

## Database Migration Priority

```sql
-- Priority 1: Project fields for claims
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contract_number VARCHAR(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS general_contractor VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS insurance_policy_number VARCHAR(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS liquidated_damages_per_day DECIMAL(10,2);

-- Priority 2: Enhanced delay tracking
ALTER TABLE delay_events ADD COLUMN IF NOT EXISTS total_days_delayed INTEGER;
ALTER TABLE delay_events ADD COLUMN IF NOT EXISTS precipitation_inches DECIMAL(5,2);
ALTER TABLE delay_events ADD COLUMN IF NOT EXISTS wind_speed_mph DECIMAL(5,2);
ALTER TABLE delay_events ADD COLUMN IF NOT EXISTS temperature_high DECIMAL(5,2);
ALTER TABLE delay_events ADD COLUMN IF NOT EXISTS temperature_low DECIMAL(5,2);
ALTER TABLE delay_events ADD COLUMN IF NOT EXISTS has_lightning BOOLEAN DEFAULT false;
ALTER TABLE delay_events ADD COLUMN IF NOT EXISTS activities_affected JSONB;
ALTER TABLE delay_events ADD COLUMN IF NOT EXISTS workers_idled INTEGER;
ALTER TABLE delay_events ADD COLUMN IF NOT EXISTS equipment_idled TEXT[];
ALTER TABLE delay_events ADD COLUMN IF NOT EXISTS subcontractors_affected TEXT[];

-- Priority 3: Weather verification
ALTER TABLE weather_readings ADD COLUMN IF NOT EXISTS station_distance_miles DECIMAL(5,2);
ALTER TABLE delay_events ADD COLUMN IF NOT EXISTS noaa_report_url TEXT;

-- Priority 4: Enhanced reporting
ALTER TABLE reports ADD COLUMN IF NOT EXISTS claim_number VARCHAR(100);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS adjuster_name VARCHAR(255);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS adjuster_email VARCHAR(255);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS settlement_amount DECIMAL(12,2);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS denial_reason TEXT;
```

## UI/UX Updates Required

1. **Project Creation/Edit Form**
   - Add contract number field
   - Add insurance policy field
   - Add general contractor field
   - Add contract value field

2. **Delay Event Tracking**
   - Separate fields for each weather type
   - Checkboxes for affected activities
   - Equipment selection dropdown
   - Subcontractor multi-select

3. **Report Generation**
   - ACORD form selection
   - Multi-signature collection
   - Notarization workflow
   - Historical weather comparison view

## Compliance & Validation Rules

1. **Weather Data**
   - Must be from station < 10 miles (configurable)
   - Must include NOAA source reference
   - Timestamp must match delay period

2. **Cost Calculations**
   - Labor must match crew assignments
   - Equipment must match project assignments
   - Overhead must be documented

3. **Documentation**
   - Photos must have EXIF timestamps
   - Daily logs must be created same day
   - All costs must have supporting records

## Comprehensive Report Types

### Reports for Different Stakeholders

#### 1. Contractor Reports
- **Daily Weather Log** - Simple conditions + work status
- **Weekly Weather Summary** - Overview for project meetings
- **Monthly Delay Report** - Total impact for invoicing
- **Cost Impact Analysis** - Detailed breakdown of losses
- **Crew Utilization Report** - Who worked/didn't work when
- **Equipment Idle Time Report** - Rental cost implications
- **Subcontractor Impact Report** - Which subs were affected
- **Year-End Weather Summary** - For tax/planning purposes

#### 2. Insurance Reports
- **Formal Claim Documentation** - Legal format with all attachments
- **Damage vs Delay Report** - Separating covered/uncovered items
- **Third-Party Verification Report** - Multiple weather sources
- **Photo Evidence Package** - Timestamped site conditions
- **Historical Comparison Analysis** - Proving "abnormal" weather

#### 3. Owner/Client Reports
- **Project Delay Notification** - Simple explanation of delays
- **Schedule Impact Report** - New completion dates
- **Cost Impact Summary** - Additional costs (if any)
- **Monthly Progress vs Weather** - Visual dashboard
- **Change Order Justification** - Supporting time extensions
- **Final Project Weather Summary** - Complete impact overview

#### 4. Specialized Reports
- **Homeowner Weather Delay Notice** - Simple, friendly format
- **HOA/Property Management Reports** - Multi-unit impacts
- **Legal/Litigation Reports** - Court-admissible format
- **Financial/Banking Reports** - Loan draw impacts
- **Government/Public Works Reports** - Compliance documentation
- **Real-Time Alert Reports** - Predictive warnings
- **Subcontractor Coordination** - Schedule updates

## Intelligent Prefilling Strategy

### Data We Can Auto-Populate

1. **From Project Settings:**
   - Project name, address, dates
   - Contract/policy numbers
   - Crew size and hourly rates
   - Weather thresholds
   - Client contact information

2. **From Weather Data:**
   - NOAA station info and distance
   - Actual weather conditions
   - Threshold violations
   - Historical comparisons

3. **From Delay Events:**
   - Dates and durations
   - Affected activities
   - Cost calculations
   - Crew impacted

4. **From User Profile:**
   - Company information
   - Insurance details
   - Preferred report formats
   - Signature blocks

### Smart Prefill Examples

```typescript
// When generating insurance claim
const claimData = {
  // Auto-filled from project
  projectName: project.name,
  contractNumber: project.contract_number,
  policyNumber: project.insurance_policy_number,
  
  // Auto-calculated from delays
  totalDaysDelayed: delays.reduce((sum, d) => sum + d.days, 0),
  totalCost: delays.reduce((sum, d) => sum + d.total_cost, 0),
  
  // Auto-fetched weather
  weatherVerification: await fetchNOAAData(delays),
  abnormalAnalysis: await compareToHistorical(delays),
  
  // Smart defaults
  claimPeriod: {
    start: delays[0].start_date,
    end: delays[delays.length - 1].end_date
  }
};
```

### Time-Saving Features

1. **Report Templates by Type:**
   - Quick select based on recipient
   - Pre-configured data fields
   - Appropriate level of detail

2. **Bulk Operations:**
   - Select multiple delays for one report
   - Batch weather verification
   - Group similar delays

3. **Progressive Enhancement:**
   - Start with basic info
   - Add details as needed
   - Save drafts for later

4. **Smart Suggestions:**
   - "Include these 3 delays from same storm?"
   - "Add cost breakdown for this claim?"
   - "Fetch historical data for comparison?"

## Report Generation UI Flow

```
1. What type of report?
   [Insurance Claim] [Client Update] [Internal Summary]

2. Smart Selection
   - Auto-select recent delays
   - Group by weather event
   - Show total impact

3. Review & Enhance
   - All data pre-filled
   - Options to add more
   - Preview before generate

4. Output Options
   - Download PDF
   - Email directly
   - Save to project
   - Schedule recurring
```

## Next Steps

1. Review with team and prioritize implementation
2. Create detailed migration scripts
3. Update UI components for new fields
4. Implement validation rules
5. Test with sample insurance claim scenarios
6. Create user documentation for insurance features
7. Build report template system
8. Implement intelligent prefilling logic