# Contractor Workflow - Real World Usage

## Typical Contractor Scenario

**Bob's Roofing Company**
- 15 employees
- 5-8 active job sites at any time
- Uses QuickBooks for accounting
- Has basic Excel spreadsheets for job tracking
- Insurance requires documentation for weather delays over $1,000

## Current Pain Points
1. **Insurance Claims**: Takes 2-3 months to get reimbursed for weather delays
2. **No Proof**: Can't prove it rained on specific days at specific sites
3. **Lost Revenue**: Loses $50K-100K annually to undocumented weather delays
4. **Manual Tracking**: Foreman texts "can't work today, raining" - no formal documentation

## How They'll Use WeatherProof

### Initial Setup (5 minutes)
1. Sign up with company email
2. Upload CSV/Excel with active projects:
   ```
   Job Name, Address, Start Date, Type, Crew Size, Daily Rate
   Smith Residence, 123 Main St, 2024-01-15, Roofing, 4, $2000
   Office Complex, 456 Oak Ave, 2024-01-20, Roofing, 8, $4000
   ```

3. Set weather thresholds:
   - Roofing: No work if wind > 25mph or rain > 0.1"
   - Concrete: No pour if temp < 40°F
   - Painting: No work if humidity > 85%

### Daily Usage
- **Morning**: Get alert at 6 AM if weather will delay work
- **During delays**: App automatically logs conditions
- **End of month**: Generate report for all delays

### Insurance Claim Process
1. Click "Generate Insurance Report" 
2. Select date range and affected projects
3. Get PDF with:
   - Official NOAA weather data
   - Time-stamped conditions
   - Cost calculations
   - Photo evidence (if uploaded)

## Import Templates

### CSV Format for Projects
```csv
project_name,address,city,state,zip,start_date,end_date,project_type,crew_size,hourly_rate,daily_overhead
"Smith Residence","123 Main St","Austin","TX","78701","2024-01-15","2024-02-15","roofing",4,50,500
"Office Complex","456 Oak Ave","Austin","TX","78702","2024-01-20","2024-03-20","roofing",8,50,800
```

### QuickBooks Integration Fields
- Customer:Job
- Job Site Address
- Job Start/End Date
- Job Type (from Item List)

### Common Project Types & Thresholds
1. **Roofing**
   - Wind: > 25 mph
   - Rain: > 0.1"
   - Temperature: < 40°F or > 95°F

2. **Concrete/Foundation**
   - Temperature: < 40°F or > 90°F
   - Rain: > 0.25"
   - Wind: > 30 mph

3. **Framing**
   - Wind: > 35 mph
   - Rain: > 0.5"
   - Lightning: Any within 10 miles

4. **Exterior Painting**
   - Temperature: < 50°F or > 90°F
   - Humidity: > 85%
   - Rain: Any precipitation
   - Wind: > 20 mph

## Quick Value Demonstration
"Last month you had 4 rain delays. WeatherProof would have documented $12,000 in delays with legal-grade weather data. Your insurance deductible is $5,000, so you could have recovered $7,000."