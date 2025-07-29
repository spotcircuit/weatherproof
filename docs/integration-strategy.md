# Construction Industry Software Integration Strategy

## Primary Tools Contractors Use

### For Roofing Contractors
1. **AccuLynx** (25% market share)
   - Built specifically for roofing
   - Has job tracking, measurements, material orders
   - API available for job data

2. **JobNimbus** (20% market share)
   - Popular CRM for roofers
   - Tracks leads, jobs, and contacts
   - REST API available

3. **EagleView** 
   - Aerial measurement reports
   - Provides job site coordinates

### For General Contractors
1. **Buildertrend** (Most popular)
   - Project scheduling
   - Has weather delay tracking (but basic)
   - API available

2. **Procore** (Enterprise)
   - Large commercial projects
   - Detailed project locations
   - Webhook integrations

3. **CoConstruct**
   - Custom home builders
   - Scheduling and project tracking

### For Service Trades (HVAC, Plumbing, Electrical)
1. **ServiceTitan** (Industry leader)
   - Job scheduling and dispatch
   - Has address and job type data
   - Robust API

2. **Housecall Pro**
   - Smaller contractors
   - Simple job management

### CRM Systems (Sales to Project Tracking)
1. **Pipedrive** (Very popular)
   - Deals = Future Projects
   - Custom fields for job details
   - Webhook when deal moves to "Won"
   - API to pull won deals

2. **HubSpot** 
   - Free tier popular with contractors
   - Deals pipeline for projects
   - Good API

3. **Salesforce**
   - Larger contractors
   - Opportunities = Projects

4. **Monday.com**
   - Project management + CRM
   - Visual pipeline

### Universal Tools (Everyone Uses)
1. **QuickBooks** (90%+ use this)
   - Customer and job data
   - Can export job list as CSV

2. **Google Calendar/Outlook**
   - Where crews actually check schedules
   - Can sync job locations

3. **Excel/Google Sheets** (Still 50%+)
   - Simple job tracking
   - Easy CSV import

## Integration Priority Order

### Phase 1: CSV Import (Week 1)
```javascript
// Simple import that covers 80% of users
const csvFormat = {
  required: [
    "job_name",
    "address", 
    "start_date"
  ],
  optional: [
    "end_date",
    "job_type", 
    "crew_size",
    "daily_rate",
    "customer_name",
    "customer_email"
  ]
}
```

### Phase 2: Direct Integrations (Month 2-3)

1. **ServiceTitan Integration**
   ```javascript
   // Pull active jobs via API
   GET /api/v2/jobs?status=in_progress
   
   // Data we get:
   {
     "id": "123",
     "name": "Smith Roof Replacement",
     "address": {
       "street": "123 Main St",
       "city": "Austin",
       "state": "TX"
     },
     "scheduled_start": "2024-01-15",
     "job_type": "Roof Replacement",
     "business_unit": "Residential Roofing"
   }
   ```

2. **QuickBooks Integration**
   ```javascript
   // Via QuickBooks API
   GET /v3/company/{companyId}/query?query=select * from Job
   
   // Map QuickBooks "Job" to our "Project"
   ```

3. **Pipedrive Integration**
   ```javascript
   // Webhook when deal wins
   POST /webhook/pipedrive
   {
     "event": "updated.deal",
     "current": {
       "id": 123,
       "title": "Smith Roofing Project",
       "stage_id": "won",
       "custom_fields": {
         "job_address": "123 Main St, Austin TX",
         "start_date": "2024-02-01",
         "job_type": "Roof Replacement",
         "crew_size": "4"
       },
       "value": 25000,
       "expected_close_date": "2024-02-01"
     }
   }
   
   // Or pull won deals via API
   GET /api/v1/deals?status=won&filter_id=123
   ```

4. **Buildertrend Webhook**
   ```javascript
   // Listen for job creates/updates
   POST /webhook/buildertrend
   {
     "event": "job.created",
     "job": {
       "address": "...",
       "schedule": {...}
     }
   }
   ```

## Smart Import Features

### Auto-Detection
1. **Detect Project Type from Description**
   - "Roof" → Apply roofing thresholds
   - "Foundation" → Apply concrete thresholds
   - "HVAC Install" → Apply service thresholds

2. **Geocoding & Validation**
   - Convert addresses to lat/lng
   - Verify address exists
   - Check for duplicate imports

3. **Threshold Templates**
   ```javascript
   const thresholdTemplates = {
     roofing: {
       wind_speed: 25, // mph
       precipitation: 0.1, // inches
       temp_min: 40, // °F
       temp_max: 95
     },
     concrete: {
       temp_min: 40,
       temp_max: 90,
       precipitation: 0.25,
       cure_time_hours: 24
     },
     painting: {
       temp_min: 50,
       temp_max: 90,
       humidity_max: 85,
       precipitation: 0.0
     }
   }
   ```

## User Journey with Integration

### Scenario: Roofer using ServiceTitan
1. Signs up for WeatherProof
2. Clicks "Connect ServiceTitan"
3. We pull their active jobs (usually 20-50)
4. Auto-apply roofing weather thresholds
5. Start monitoring immediately
6. They get delay alerts in ServiceTitan AND via our n8n webhooks

### Scenario: Small contractor with Excel
1. Downloads our Excel template
2. Fills in their 10 active jobs
3. Uploads to WeatherProof
4. We geocode addresses and set thresholds
5. Ready to go in 5 minutes

## Revenue Model Integration
- Basic: Manual CSV import ($49/mo)
- Pro: 1 integration ($99/mo)
- Enterprise: Unlimited integrations ($299/mo)

## Quick Win: ServiceTitan App Store
- List WeatherProof in ServiceTitan marketplace
- Instant credibility
- Built-in distribution to 10,000+ contractors