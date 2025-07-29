# Insurance Claims Documentation & Systems

## Insurance Companies & Their Systems

### Major Construction Insurance Providers
1. **Travelers** (25% market share)
   - Uses: Guidewire ClaimCenter
   - Submission: Email PDFs or their portal
   - Requires: Official weather data, photos, sworn statements

2. **Liberty Mutual**
   - Uses: Duck Creek Claims
   - Submission: Online portal or adjuster email
   - Requires: NOAA data specifically mentioned in policies

3. **CNA**
   - Uses: Guidewire
   - Submission: Agent submission
   - Requires: Daily logs, weather station data

4. **Zurich**
   - Uses: Proprietary system
   - Submission: ClaimConnect portal
   - Requires: Third-party weather verification

### Insurance Claim Management Systems

1. **Guidewire ClaimCenter** (40% of insurers)
   - Accepts: PDF, XML, API submissions
   - Key fields: Policy number, date of loss, peril type, amount

2. **Duck Creek Claims**
   - Accepts: Portal uploads, email
   - Prefers: Structured data with timestamps

3. **Xactimate** (for estimating)
   - Used for: Calculating repair costs
   - Integration: Can import weather data

## Required Documentation for Weather Claims

### 1. Weather Verification (MOST CRITICAL)
```
REQUIRED:
- Official weather source (NOAA preferred)
- Exact location (lat/lng or address)
- Hourly data for claim period
- Wind speed, precipitation, temperature
- Weather station distance from site

ACCEPTED SOURCES:
- NOAA/National Weather Service (gold standard)
- Weather Underground (if station < 5 miles)
- Airport weather stations
- On-site weather monitoring devices
```

### 2. Project Documentation
```
- Contract/work order showing:
  - Start date
  - Scope of work
  - Daily rates/costs
  
- Schedule showing:
  - Planned work days
  - Crew assignments
  - Critical path activities
```

### 3. Impact Documentation
```
- Daily logs showing:
  - Crew arrived but couldn't work
  - Specific weather conditions
  - Safety concerns
  - Work attempted/stopped
  
- Photos/videos showing:
  - Site conditions
  - Standing water
  - Wind damage
  - Date/time stamps
```

### 4. Cost Calculation
```
- Labor costs:
  - Number of workers × hourly rate × hours lost
  - Show-up time (minimum 2-4 hours usually covered)
  
- Equipment costs:
  - Rental equipment sitting idle
  - Crane/specialized equipment daily rates
  
- Overhead:
  - Project management
  - Site security
  - Portable facilities
  
- Indirect costs:
  - Schedule compression
  - Overtime to catch up
  - Liquidated damages
```

## Claim Submission Formats

### Standard Insurance Claim Package
```
1. Cover Letter
   - Policy number
   - Claim summary
   - Total amount requested

2. Weather Report (CRITICAL)
   - Executive summary
   - Daily weather log
   - Threshold exceedances highlighted
   - Source citations

3. Project Impact Analysis
   - Days affected
   - Activities impacted
   - Cost breakdown

4. Supporting Documents
   - Contracts
   - Schedules
   - Daily reports
   - Photos

5. Sworn Statement
   - Notarized affidavit
   - Attesting to accuracy
```

### What Makes Claims Get APPROVED

✅ **Official weather data** - NOAA is unquestionable
✅ **Clear thresholds** - "Contract states no roofing work when wind > 25mph"
✅ **Time stamps** - Prove crew was scheduled and weather hit
✅ **Photo evidence** - Especially with timestamps
✅ **Consistent documentation** - Daily logs match weather data
✅ **Professional presentation** - Clean, organized PDFs

### What Makes Claims Get DENIED

❌ **"It was raining"** - No official data
❌ **After-the-fact** - Trying to document weeks later
❌ **Inconsistent data** - Weather doesn't match claims
❌ **No contractual basis** - No weather clauses in contract
❌ **Excessive claims** - Claiming full day for 1-hour rain
❌ **Poor documentation** - Handwritten notes, no photos

## Integration Opportunities

### Direct Insurance Integrations
1. **Guidewire API**
   ```json
   {
     "claimNumber": "2024-001234",
     "policyNumber": "CPP-789456",
     "lossDate": "2024-01-15",
     "lossType": "Weather Delay",
     "description": "High winds prevented roofing work",
     "amount": 12500.00,
     "documentation": ["weather_report.pdf", "daily_logs.pdf"]
   }
   ```

2. **Insurance Broker Platforms**
   - Applied Epic
   - AMS360
   - Salesforce Financial Services Cloud

### Report Format That Insurers Love

```
WEATHERPROOF DELAY CERTIFICATION REPORT
=====================================
Claim Period: January 15-22, 2024
Project: Smith Commercial Roofing
Location: 123 Main St, Austin, TX 78701
Policy: CPP-789456

EXECUTIVE SUMMARY
- Total Delay Days: 4
- Total Claim Amount: $14,750
- Weather Events: High Wind (2 days), Heavy Rain (2 days)

DETAILED WEATHER LOG
Date: January 15, 2024
Weather Station: KAUS (2.3 miles from site)
- 09:00 - Wind Speed: 28 mph (Exceeds 25 mph threshold)
- 10:00 - Wind Speed: 32 mph, Gusts to 41 mph
- Decision: Crew sent home at 10:30 AM
- Source: NOAA Station KAUS, Report #2024-015-0930

[Include charts, graphs, photos]

CERTIFICATION
This report compiled from official NOAA data.
WeatherProof Report ID: WP-2024-001234
Generated: January 30, 2024
```

## Value Proposition for Insurers

1. **Reduce Fraud** - Verified weather data prevents false claims
2. **Faster Processing** - Standardized format, pre-verified data
3. **Lower Investigation Costs** - No need to research weather
4. **Better Risk Assessment** - Historical delay data by region

## Potential Insurance Partnerships

"WeatherProof Certified" claims process:
- Pre-approved by major insurers
- Fast-track processing (14 days vs 60 days)
- Lower deductibles for contractors using WeatherProof
- Insurance companies could subsidize WeatherProof for their clients