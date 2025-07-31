# Delay Documentation Requirements for Insurance Claims

## Current Form vs. Insurance Requirements

### ❌ What We Have Now:
- Generic crew count
- Generic hourly rate
- Basic weather data
- Simple cost calculation

### ✅ What Insurance Companies REQUIRE:

## 1. Crew Documentation (MUST BE SPECIFIC)

**Required Data:**
- **Individual crew member names**
- **Their specific trade/role**
- **Individual hourly rates**
- **Burden rate per person** (benefits, taxes, insurance)
- **Exact hours each was idle**

**Example:**
```
John Smith - Foreman - $85/hr × 8 hrs × 1.35 burden = $918
Mike Jones - Carpenter - $45/hr × 8 hrs × 1.35 burden = $486
Tim Brown - Carpenter - $45/hr × 8 hrs × 1.35 burden = $486
Joe Davis - Laborer - $25/hr × 8 hrs × 1.35 burden = $270
TOTAL LABOR: $2,160
```

## 2. Equipment Documentation (MUST BE SPECIFIC)

**Required Data:**
- **Specific equipment identification**
- **Standby rate vs operational rate**
- **Owned vs rented**
- **Hours idled**
- **Rental company (if applicable)**

**Example:**
```
CAT 320 Excavator - Owned - $75/hr standby × 8 hrs = $600
50-Ton Crane - Rented from ABC Rentals - $500/day = $500
Concrete Pump - Rented - $200/hr standby × 8 hrs = $1,600
Generator - Owned - $25/hr standby × 8 hrs = $200
TOTAL EQUIPMENT: $2,900
```

## 3. Weather Documentation

**Required:**
- Temperature (high/low)
- Wind speed (MPH)
- Wind gusts
- Precipitation (inches)
- Lightning (yes/no)
- Visibility
- **Station within 10 miles**
- **NOAA verification link**

## 4. Activity Documentation

**Required:**
- What work was planned
- Why it couldn't proceed
- Which trades were affected
- Safety concerns

## 5. Cost Breakdown

**Insurance wants to see:**
```
Labor Costs:
- Base wages: $1,600
- Burden (35%): $560
- Total Labor: $2,160

Equipment Costs:
- Owned equipment standby: $800
- Rented equipment: $2,100
- Total Equipment: $2,900

Overhead Allocation:
- Daily overhead: $500
- Hours delayed: 8
- Overhead cost: $500

Material Protection:
- Tarps/covering: $150
- Material movement: $200
- Total Protection: $350

TOTAL DELAY COST: $5,910
```

## What This Means for the Form

### Current Form Fields:
- Project (dropdown)
- Start/End Time
- Weather Condition (text)
- Crew Size (number)
- Crew Affected (number)
- Notes

### NEEDED Form Fields:
1. **Crew Selection:**
   - Checkbox list of assigned crew
   - Show role and rate for each
   - Hours idle per person

2. **Equipment Selection:**
   - Checkbox list of assigned equipment
   - Show standby rate
   - Indicate if rented
   - Hours idle per equipment

3. **Weather Details:**
   - Temperature high/low
   - Wind speed/gusts
   - Precipitation amount
   - Lightning detected
   - Visibility

4. **Activities Affected:**
   - [ ] Concrete work
   - [ ] Excavation
   - [ ] Roofing
   - [ ] Exterior work
   - [ ] Crane operations
   - [ ] Other: _______

5. **Additional Costs:**
   - Material protection costs
   - Equipment demobilization
   - Subcontractor standby

## Database Tables Needed

We already created these in migration 012:
- `delay_crew_affected` - Track specific crew
- `delay_equipment_affected` - Track specific equipment

But the form doesn't use them yet!

## Implementation Priority

1. **First**: Run migration 014 to add missing columns
2. **Second**: Update form to show crew/equipment checkboxes
3. **Third**: Save to relationship tables
4. **Fourth**: Update cost calculations

Without this level of detail, insurance claims will be REJECTED.