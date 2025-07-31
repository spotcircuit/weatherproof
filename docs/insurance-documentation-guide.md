# Insurance Documentation Guide

## Overview
This guide consolidates all insurance-related requirements, workflows, and documentation standards for WeatherProof.

## Insurance Requirements for Weather Delay Claims

### Essential Documentation Required
1. **Project Information**
   - Contract number
   - Insurance policy number
   - General contractor (if subcontractor)
   - Contract value
   - Project location with exact address

2. **Weather Data Requirements**
   - Official government source (NOAA preferred)
   - Weather station within 10 miles of site
   - Specific measurements:
     - Wind speed (MPH)
     - Precipitation (inches)
     - Temperature (high/low)
     - Lightning detection
   - Timestamp of readings

3. **Delay Documentation**
   - Start and end times (exact)
   - Total days delayed (integer)
   - Specific activities affected:
     - Concrete work
     - Excavation
     - Roofing
     - Exterior work
     - Crane operations
   - Reason for work stoppage

4. **Cost Documentation**
   - **Labor Costs**:
     - Specific crew members affected (names)
     - Individual hourly rates
     - Hours idled per person
     - Burden rate (benefits/taxes ~35%)
   - **Equipment Costs**:
     - Specific equipment idled (list)
     - Standby rates (not operational)
     - Hours idled per equipment
   - **Overhead Costs**:
     - Daily overhead allocation
   - **Material Damage** (if applicable)

5. **Supporting Evidence**
   - Timestamped photos of site conditions
   - Daily logs/reports
   - Supervisor statements
   - NOAA verification links

## Insurance Company Requirements

### Major Carriers & Their Systems
1. **Travelers** (25% market share)
   - System: Guidewire ClaimCenter
   - Submission: Email PDFs or portal
   - Special: Requires sworn statements

2. **Liberty Mutual**
   - System: Duck Creek Claims
   - Submission: Online portal
   - Special: NOAA data mandatory

3. **CNA**
   - System: Guidewire
   - Submission: Agent submission
   - Special: Daily logs required

4. **Zurich**
   - System: ClaimConnect portal
   - Submission: Portal only
   - Special: Third-party verification

## Report Formats

### Standard Insurance Report Contents
1. **Executive Summary**
   - Project details
   - Claim period
   - Total days delayed
   - Total cost claimed

2. **Weather Verification**
   - NOAA station details
   - Distance from site
   - Abnormal weather analysis
   - Historical comparison

3. **Detailed Cost Breakdown**
   - Labor costs with burden
   - Equipment standby costs
   - Overhead allocation
   - Subtotals by category

4. **Supporting Documentation**
   - Photo evidence
   - Daily logs
   - Weather data printouts
   - Supervisor certifications

### ACORD Forms
- **ACORD 101**: Property Loss Notice
- **ACORD 140**: Property Section
- Required fields mapped in `acord-mapper.ts`

## Claim Submission Process

### Pre-Submission Checklist
- [ ] All delays have end times
- [ ] Weather data verified with NOAA
- [ ] Specific crew/equipment documented
- [ ] Photos uploaded with timestamps
- [ ] Costs calculated with burden rates
- [ ] Report generated and reviewed
- [ ] Signatures obtained

### Submission Steps
1. Generate comprehensive report
2. Include all supporting documents
3. Submit via carrier's preferred method
4. Track claim number
5. Follow up within 48 hours

## Common Rejection Reasons

1. **Insufficient Weather Data**
   - Station too far (>10 miles)
   - Non-official source
   - Missing specific measurements

2. **Inadequate Cost Documentation**
   - Generic crew counts (not names)
   - Missing burden rates
   - Using operational vs standby rates

3. **Missing Information**
   - No contract number
   - No policy number
   - No photo evidence
   - No daily logs

## Best Practices

### Daily Operations
1. Document delays immediately
2. Take photos during delays
3. Record specific crew present
4. Note equipment status
5. Save NOAA data daily

### Cost Calculations
- Labor: Rate × Hours × 1.35 (burden)
- Equipment: Standby Rate × Hours
- Overhead: Daily Rate × (Hours/8)

### Report Generation
1. Include all delays in period
2. Group by weather event
3. Show cumulative impact
4. Provide executive summary
5. Attach all evidence

## Database Requirements

### Required Fields for Claims
- `projects`: contract_number, insurance_policy_number, insurance_carrier
- `delay_events`: specific weather measurements, activities_affected
- `delay_crew_affected`: individual crew tracking with rates
- `delay_equipment_affected`: equipment tracking with standby rates
- `weather_readings`: NOAA verification data

### Cost Formula
```
Total Claim = 
  Σ(crew_hours × rate × burden) +
  Σ(equipment_hours × standby_rate) +
  (overhead_daily × days) +
  material_damage
```

## Legal Considerations

### Certification Requirements
- Supervisor must certify accuracy
- Company officer signature
- Some carriers require notarization
- Keep records for 7 years

### Fraud Prevention
- Never exaggerate conditions
- Document everything contemporaneously
- Use only official weather data
- Maintain photo metadata

## Integration Points

### Current
- NOAA Weather API for verification
- PDF generation for reports
- Photo storage with metadata

### Future
- Direct carrier API submission
- Automated claim tracking
- Historical weather analysis
- Real-time alert systems

---

**Remember**: Insurance companies require SPECIFIC documentation, not general summaries. Always document WHO was affected, WHAT equipment was idled, and exact weather measurements from official sources.