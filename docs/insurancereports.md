Weather Delay Claim Requirements & Database Mapping
Overview
This document outlines the insurance claim forms and documentation requirements for construction weather delays, and maps them to the necessary database structure and components.
1. Standard Claim Form Requirements
ACORD Forms (Standard Insurance Forms)

ACORD 101 - Additional Remarks Schedule
Notice of Claim Form - Initial notification
Delay Claim Documentation Form - Specific to construction delays

2. Required Claim Form Fields
Section 1: Project Information
Required Fields:
- Project Name
- Project Address
- Contract Number
- General Contractor
- Subcontractor (if applicable)
- Insurance Policy Number
Database Mapping:
sqlCREATE TABLE projects (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  address VARCHAR(500),
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  contract_number VARCHAR(100),
  general_contractor VARCHAR(255),
  insurance_policy_number VARCHAR(100),
  contract_value DECIMAL(12,2),
  start_date DATE,
  end_date DATE,
  daily_overhead DECIMAL(10,2),
  liquidated_damages_per_day DECIMAL(10,2),
  weather_thresholds JSONB
);
Section 2: Delay Details
Required Fields:
- Date(s) of Weather Event (From/To)
- Total Days Delayed
- Weather Type:
  - Rain/Precipitation (amount in inches)
  - Wind (speed in mph)
  - Temperature (high/low in °F)
  - Snow/Ice (amount in inches)
  - Lightning
  - Other
Database Mapping:
sqlCREATE TABLE weather_delay_events (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  total_days_delayed INTEGER,
  weather_type VARCHAR(50),
  precipitation_inches DECIMAL(5,2),
  wind_speed_mph DECIMAL(5,2),
  temperature_high DECIMAL(5,2),
  temperature_low DECIMAL(5,2),
  snow_inches DECIMAL(5,2),
  has_lightning BOOLEAN,
  other_conditions TEXT
);
Section 3: Impact Assessment
Required Fields:
- Activities Affected (checkboxes):
  - Concrete Pour
  - Excavation
  - Roofing
  - Exterior Work
  - Crane Operations
  - Other
- Workers Idled (number)
- Equipment Idled (list)
- Subcontractors Affected (list)
Database Mapping:
sqlCREATE TABLE delay_impacts (
  id UUID PRIMARY KEY,
  weather_delay_event_id UUID REFERENCES weather_delay_events(id),
  activities_affected TEXT[], -- Array of affected activities
  workers_idled INTEGER,
  equipment_idled TEXT[],
  subcontractors_affected TEXT[]
);
Section 4: Cost Impact
Required Fields:
- Labor Costs
- Equipment Standby
- Extended General Conditions
- Material Storage/Protection
- TOTAL CLAIM
Database Mapping:
sqlCREATE TABLE delay_costs (
  id UUID PRIMARY KEY,
  weather_delay_event_id UUID REFERENCES weather_delay_events(id),
  labor_costs DECIMAL(10,2),
  equipment_standby_costs DECIMAL(10,2),
  extended_general_conditions DECIMAL(10,2),
  material_storage_protection DECIMAL(10,2),
  total_claim_amount DECIMAL(12,2)
);
3. Supporting Documentation Requirements
Required Attachments:

Weather Reports (NOAA/NWS data)
Daily Field Reports
Site Photographs
Time Sheets (showing idle crews)
Equipment Logs
Schedule Impact Analysis
Third-Party Weather Service Data (optional)

Database Schema for Documentation:
sqlCREATE TABLE claim_documents (
  id UUID PRIMARY KEY,
  weather_delay_event_id UUID REFERENCES weather_delay_events(id),
  document_type VARCHAR(50), -- 'weather_report', 'daily_log', 'photo', etc.
  file_url VARCHAR(500),
  description TEXT,
  created_at TIMESTAMPTZ
);
4. Weather Analysis Requirements
Must Prove "Abnormal" Weather
The system must generate reports showing:

Historical weather data (5-10 year average)
Actual conditions during delay
Percentage deviation from normal
Conclusion that weather was "not reasonably anticipated"

Example Report Format:
WEATHER ANALYSIS REPORT

Location: [Job Site Address]
Period: March 15-17, 2024

Normal Conditions (10-year average):
- March rainfall: 3.2 inches (total month)
- Average daily: 0.10 inches
- Days with >0.5": 2 days

Actual Conditions:
- March 15-17: 5.8 inches (3 days)
- Daily average: 1.93 inches
- Exceeded normal by: 1,830%

Conclusion: Weather conditions were abnormal
and not reasonably anticipated.
5. Critical Path Impact Documentation
Must Demonstrate:

Delay is within contract terms
Activity delayed affects project end date (on critical path)
Weather exceeded normal for the season
Specific documentation of affected activities

Database Support:
sqlCREATE TABLE critical_path_impacts (
  id UUID PRIMARY KEY,
  weather_delay_event_id UUID REFERENCES weather_delay_events(id),
  original_end_date DATE,
  revised_end_date DATE,
  critical_activities_affected TEXT[],
  schedule_impact_narrative TEXT
);
6. Cost Calculation Components
Labor Cost Tracking:
sqlCREATE TABLE crew_members (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  role VARCHAR(100),
  base_hourly_rate DECIMAL(6,2),
  overtime_rate DECIMAL(6,2),
  burden_rate DECIMAL(4,2) -- Benefits, taxes, etc.
);

CREATE TABLE project_crew_assignments (
  project_id UUID,
  crew_member_id UUID,
  start_date DATE,
  end_date DATE,
  daily_hours INTEGER DEFAULT 8,
  project_hourly_rate DECIMAL(6,2)
);

CREATE TABLE idle_crew_costs (
  weather_delay_event_id UUID,
  crew_member_id UUID,
  hours_idle DECIMAL(5,2),
  cost_per_hour DECIMAL(6,2),
  total_cost DECIMAL(10,2)
);
Equipment Cost Tracking:
sqlCREATE TABLE equipment (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  type VARCHAR(100),
  owned_or_rented ENUM('owned', 'rented')
);

CREATE TABLE equipment_rates (
  equipment_id UUID,
  project_id UUID,
  daily_rate DECIMAL(10,2),
  weekly_rate DECIMAL(10,2),
  monthly_rate DECIMAL(10,2),
  standby_rate DECIMAL(10,2) -- Rate when idle
);

CREATE TABLE idle_equipment_costs (
  weather_delay_event_id UUID,
  equipment_id UUID,
  days_idle DECIMAL(5,2),
  standby_rate_per_day DECIMAL(10,2),
  total_cost DECIMAL(10,2)
);
7. Report Generation Requirements
Formal Claim Letter Template:
[Date]

Re: Weather Delay Claim - [Project Name]
Contract #: [Contract Number]

Dear [Insurance Company/Owner]:

This letter serves as formal notice of a weather-related delay claim under the terms of our contract.

Delay Event:
- Dates: [Start Date - End Date]
- Cause: [Weather Type and Measurements]
- Normal conditions for period: [Historical Average]
- Activities impacted: [List of Activities]

Documentation attached:
1. NOAA weather data showing abnormal conditions
2. Daily reports documenting work stoppage
3. Site photographs showing conditions
4. CPM schedule showing critical path impact
5. Cost breakdown of delay impacts

Total delay: [X] working days
Total cost impact: $[Amount]

We request an extension of time and compensation for the additional costs incurred as outlined in the attached documentation.

Sincerely,
[Contractor Name]
8. Key Validations & Business Rules
Weather Thresholds (Configurable per Project):

Concrete Pour: Cannot proceed below 40°F
Crane Operations: Wind speed limit 35 mph
Roofing: No work above 25 mph wind
Excavation: Rainfall limit 0.5 inches

Documentation Requirements:

Weather data must be from official sources (NOAA, NWS)
Daily logs must be contemporaneous (created same day)
Photos must have timestamp metadata
All costs must tie to specific crew/equipment records

9. Integration Points
External Data Sources:

NOAA API - Historical and current weather data
Weather Underground - Hyperlocal conditions
Project Management Systems - Procore, Buildertrend
Accounting Systems - QuickBooks, Sage

Export Formats:

PDF reports for claims
CSV for cost breakdowns
XML for insurance company systems
JSON for API integrations

10. Compliance Requirements
Must Maintain:

Audit trail of all changes
Document retention (7 years)
User access logs
Data encryption at rest and in transit
SOC 2 compliance for insurance companies

Implementation Checklist

 Database schema supports all required fields
 Weather data integration with NOAA/NWS
 Cost calculation engine for labor/equipment
 Document storage system (S3 or equivalent)
 Report generation with all required sections
 Historical weather analysis comparison
 Critical path impact documentation
 Photo timestamp verification
 Export to insurance-required formats
 Audit trail and compliance features

Notes for Development

Priority Features:

Real-time weather tracking
Automatic cost calculations
One-click report generation
Mobile app for field documentation


Future Enhancements:

AI-powered claim prediction
Integration with insurance systems
Automated claim submission
Weather forecast alerts


Key Differentiators:

Multi-source weather verification
Legal-grade documentation
Instant historical comparison
Insurance-ready formatting


