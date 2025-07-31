// Comprehensive form field guidance for all forms in the application
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { ReactNode } from 'react'

// Helper component to wrap any label with tooltip
export function LabelWithTooltip({ 
  children, 
  tooltip,
  required = false 
}: { 
  children: ReactNode
  tooltip: string
  required?: boolean 
}) {
  return (
    <label className="text-sm font-medium flex items-center gap-1">
      {children}
      {required && <span className="text-red-500">*</span>}
      <InfoTooltip content={tooltip} />
    </label>
  )
}

// Type definition for field guidance
type FieldGuidanceRecord = Record<string, string>
type FieldGuidanceCategories = Record<string, FieldGuidanceRecord>

// Comprehensive field guidance for all forms
export const FIELD_GUIDANCE: FieldGuidanceCategories = {
  // Project Form Fields
  project: {
    name: "Use descriptive names like '123 Main St - Office Building' for easy identification",
    address: "Full address including ZIP code. This determines weather station selection (must be within 10 miles)",
    contractNumber: "Required for insurance claims. Use your internal project/contract number",
    contractValue: "Total contract value helps calculate delay impact percentage for insurance",
    insuranceCarrier: "Your builder's risk or general liability carrier (e.g., Travelers, Liberty Mutual)",
    insurancePolicyNumber: "Policy number from your insurance documents - critical for claims",
    insuranceDeductible: "Know your deductible - delays under this amount may not be worth claiming",
    generalContractor: "If you're a subcontractor, list the GC. Required for sub claims",
    liquidatedDamages: "Daily penalty for delays. Important for schedule impact claims ($500-5000/day typical)",
    crewSize: "Average crew size helps estimate impact. Will select individuals for actual delays",
    hourlyRate: "Average base rate. Individual rates used for claims. Don't include burden here",
    dailyOverhead: "Fixed costs that continue during delays: office, insurance, equipment leases, supervision"
  },

  // Delay Documentation Fields
  delay: {
    startTime: "Exact time work stopped. Match with NOAA weather data timestamps",
    endTime: "When work resumed. Leave blank if ongoing. Must be filled for cost calculation",
    weatherCondition: "Be specific: 'Heavy Rain 2\"/hr' not just 'Rain'. Matches insurance requirements",
    
    // Weather specifics
    windSpeed: "Sustained wind speed in MPH. Roofing stops at 25mph, cranes at 30mph, general at 35mph",
    windGust: "Maximum gust speed. Often the limiting factor. OSHA guidelines apply",
    precipitation: "Amount in inches. 0.1\" affects concrete/roofing, 0.5\" stops most work",
    temperature: "Document both high and low. Concrete limits: 40-90°F, General work: 20-95°F",
    lightning: "Work must stop if lightning within 10 miles. Use 30-30 rule for safety",
    visibility: "In miles. Under 0.5 miles typically stops equipment operation",
    
    // Crew & Equipment
    crewSelection: "Select INDIVIDUAL crew members affected. Generic counts will be REJECTED by insurance",
    crewBurdenRate: "Add 35-40% to base wage for taxes, insurance, benefits. Industry standard is 35%",
    equipmentSelection: "List ALL idled equipment. Include model numbers for insurance",
    standbyRate: "Owned equipment: 50-70% of operational rate. Rented: 100% (you pay anyway)",
    
    // Activities
    activitiesAffected: "Be specific: 'Pour 50 CY foundation' not 'Concrete work'. Insurance wants details",
    safetyConcerns: "Document why work stopped: slip hazards, equipment stability, material protection",
    
    // Costs
    materialProtection: "Tarps, plastic, moving materials under cover. Keep receipts. $200-1000 typical",
    overtimeToRecover: "If you work overtime to catch up after delay, document those costs too",
    subcontractorStandby: "If subs were on standby, get their documentation and costs",
    
    // Documentation
    photos: "Minimum 4 photos: 1) Sky/weather, 2) Standing water/conditions, 3) Idle crew/equipment, 4) Protected materials",
    supervisorNotes: "Detailed notes strengthen claims. Include safety decisions and specific impacts"
  },

  // Report Generation Fields
  report: {
    periodSelection: "Group delays by weather event when possible. 7-30 day periods typical",
    reportType: "Insurance Claim: Full documentation. Daily Log: Simplified. Executive: Summary only",
    includePhotos: "Always include photos for insurance claims. Reduces rejection rate by 60%",
    weatherVerification: "NOAA links will be included automatically. Station must be within 10 miles",
    costBreakdown: "Detailed breakdown required: Labor, Equipment, Overhead, Materials separately",
    certification: "Reports may need notarization for claims over $50,000"
  },

  // Crew Management Fields
  crew: {
    name: "Use full legal names for insurance documentation, not nicknames",
    role: "Be specific: 'Journeyman Carpenter' not just 'Carpenter'. Affects burden rate",
    hourlyRate: "Base rate only. Burden (taxes/benefits) calculated separately at claim time",
    burdenRate: "typically 1.35 (35%). Higher for specialized trades (up to 50%)",
    trade: "Trade classification affects safety requirements and weather thresholds",
    certifications: "Document special certifications - may affect allowable weather conditions"
  },

  // Equipment Fields
  equipment: {
    name: "Include manufacturer and model: 'CAT 320D Excavator' not just 'Excavator'",
    operationalRate: "Normal working rate per hour. Used to calculate standby rate",
    standbyRate: "Idle rate when not working. Owned: 50-70% of operational. Rented: often 100%",
    isRented: "Critical distinction - rented equipment costs continue even when idle",
    rentalCompany: "Include rental company name and agreement number for documentation",
    dailyMinimum: "Many rentals have 4 or 8-hour minimums regardless of use"
  },

  // Insurance Settings
  insurance: {
    weatherDeductible: "Specific deductible for weather delays - may differ from general deductible",
    aggregateLimit: "Annual limit for weather claims. Track cumulative claims against this",
    waitingPeriod: "Some policies require 24-72 hour waiting period before coverage starts",
    coverageType: "Builder's Risk typically covers weather delays. General Liability usually doesn't",
    namedStorms: "Named storms (hurricanes) may have separate higher deductibles",
    seasonalLimits: "Some policies limit winter weather claims or have seasonal sub-limits"
  },

  // Company Settings
  company: {
    defaultBurdenRate: "Company-wide burden rate. Industry average 35-40%. Calculate yours accurately",
    defaultOverhead: "Daily fixed costs: office rent, insurance, admin staff, equipment leases",
    weatherThresholds: "Set conservative thresholds. Better to stop work than have an accident",
    notificationSettings: "Get alerts BEFORE weather hits. 4-hour advance warning recommended"
  }
}

// Helper function to get guidance for any field
export function getFieldGuidance(category: string, field: string): string {
  const categoryGuidance = FIELD_GUIDANCE[category] as FieldGuidanceRecord | undefined
  return categoryGuidance?.[field] || ''
}

// Common percentage/rate guidance
export const RATE_GUIDANCE = {
  burdenRate: {
    minimum: 1.25,
    typical: 1.35,
    maximum: 1.50,
    tooltip: "Burden Rate Breakdown:\n• Payroll Taxes: 7.65%\n• Workers Comp: 5-15%\n• Liability: 2-5%\n• Benefits: 10-15%\n• Other: 2-5%\nTotal: 25-50% (use 35% if unsure)"
  },
  standbyRate: {
    owned: {
      minimum: 0.40,
      typical: 0.50,
      maximum: 0.70,
      tooltip: "Owned Equipment Standby:\n• Small tools: 40-50%\n• Standard equipment: 50%\n• Specialized equipment: 60-70%\n• Includes depreciation and maintenance"
    },
    rented: {
      rate: 1.00,
      tooltip: "Rented Equipment:\n• Usually 100% of rental rate\n• You pay whether used or not\n• Check rental agreement for terms\n• May have daily minimums"
    }
  },
  overhead: {
    small: { min: 300, typical: 500, max: 1000 },
    medium: { min: 1000, typical: 2000, max: 3000 },
    large: { min: 3000, typical: 5000, max: 10000 },
    tooltip: "Daily Overhead Calculation:\n• Office rent & utilities\n• Insurance premiums\n• Office staff salaries\n• Equipment leases\n• Divide monthly costs by 20 working days"
  }
}

// Insurance company specific requirements (future enhancement)
export const CARRIER_REQUIREMENTS = {
  travelers: {
    photoMinimum: 6,
    weatherStationMax: 10,
    requiresNotarization: true,
    deductible: "1% of project value typical"
  },
  libertyMutual: {
    photoMinimum: 4,
    weatherStationMax: 15,
    requiresNotarization: false,
    deductible: "$10,000 minimum typical"
  },
  zurich: {
    photoMinimum: 8,
    weatherStationMax: 10,
    requiresNotarization: true,
    deductible: "Varies by region"
  }
}

// Quick validation helpers
export function validateBurdenRate(rate: number): { valid: boolean; message: string } {
  if (rate < RATE_GUIDANCE.burdenRate.minimum) {
    return { valid: false, message: "Burden rate seems low. Typical is 35% (1.35)" }
  }
  if (rate > RATE_GUIDANCE.burdenRate.maximum) {
    return { valid: false, message: "Burden rate seems high. Typical is 35% (1.35)" }
  }
  return { valid: true, message: "" }
}

export function validateStandbyRate(rate: number, isRented: boolean): { valid: boolean; message: string } {
  if (isRented && rate < 1.0) {
    return { valid: false, message: "Rented equipment typically charges 100% when idle" }
  }
  if (!isRented && rate > 0.7) {
    return { valid: false, message: "Owned equipment standby usually 50-70% of operational" }
  }
  return { valid: true, message: "" }
}