// Insurance claim guidance and industry standards

export const INSURANCE_GUIDANCE = {
  crew: {
    burdenRate: {
      default: 1.35,
      tooltip: "Burden rate includes payroll taxes (7.65%), workers comp (5-15%), liability insurance (2-5%), benefits (10-15%). Industry standard is 35-40% above base wage.",
      breakdown: {
        'Payroll Taxes': '7.65%',
        'Workers Comp': '5-15%',
        'Liability Insurance': '2-5%',
        'Health Benefits': '8-12%',
        'Other Benefits': '2-5%'
      }
    },
    documentation: "Insurance requires individual crew member names, roles, and rates. Generic counts will be rejected."
  },
  
  equipment: {
    standbyRates: {
      default: 0.5,
      tooltip: "Standby rates are typically 50-70% of operational rates. Rented equipment may have fixed daily minimums.",
      guidelines: {
        'Owned Equipment': '50% of operational rate',
        'Rented Equipment': '100% of rental rate (you pay regardless)',
        'Specialized Equipment': '60-70% of operational rate',
        'Small Tools': 'Usually not tracked unless over $500/day'
      }
    },
    documentation: "List specific equipment with model numbers. Include rental agreements for rented equipment."
  },
  
  weather: {
    stationDistance: {
      maximum: 10,
      preferred: 5,
      tooltip: "Weather station must be within 10 miles for insurance acceptance. Closer is better for claim approval."
    },
    thresholds: {
      wind: {
        roofing: { speed: 25, gust: 35, tooltip: "OSHA requires stopping roofing work at 25 mph sustained or 35 mph gusts" },
        crane: { speed: 30, gust: 40, tooltip: "Most crane operations cease at 30 mph sustained winds" },
        general: { speed: 35, gust: 45, tooltip: "General construction typically stops at 35 mph sustained winds" }
      },
      precipitation: {
        concrete: { amount: 0.1, tooltip: "Any precipitation can damage fresh concrete" },
        roofing: { amount: 0.1, tooltip: "Roofing must stop with any precipitation for safety" },
        excavation: { amount: 0.25, tooltip: "Excavation typically stops at 0.25 inches per hour" },
        general: { amount: 0.5, tooltip: "Most work stops at 0.5 inches per hour" }
      },
      temperature: {
        concrete: { min: 40, max: 90, tooltip: "Concrete cannot be placed below 40°F or above 90°F without special measures" },
        roofing: { min: 40, max: 95, tooltip: "Adhesives and materials fail outside this range" },
        general: { min: 20, max: 95, tooltip: "OSHA guidelines for worker safety" }
      },
      lightning: {
        radius: 10,
        tooltip: "OSHA requires stopping work with lightning within 10 miles. 30-30 rule: 30 seconds thunder to lightning = 6 miles"
      }
    }
  },
  
  costs: {
    overhead: {
      calculation: "Daily overhead ÷ 8 hours × hours delayed",
      tooltip: "Include office rent, insurance, equipment leases, supervisory staff, and other fixed daily costs",
      typical: "$300-1000/day for small contractors, $1000-5000/day for larger operations"
    },
    materialProtection: {
      tooltip: "Document costs for tarps, plastic sheeting, moving materials to cover, temporary storage",
      typical: "$200-1000 per delay event"
    },
    documentation: "Keep all receipts. Photo document protection measures."
  },
  
  activities: {
    affectedWork: {
      tooltip: "Be specific about work that couldn't proceed. 'General construction' is too vague for insurance.",
      examples: [
        "Concrete foundation pour - 50 cubic yards scheduled",
        "Roofing installation - 30 squares of shingles",
        "Exterior framing - second floor walls",
        "Site excavation - storm drain installation"
      ]
    }
  },
  
  photos: {
    requirements: {
      tooltip: "Photos must show: 1) Weather conditions, 2) Work area affected, 3) Crew/equipment present but idle, 4) Timestamp",
      minimum: 4,
      recommended: 8,
      mustInclude: [
        "Sky conditions showing weather",
        "Standing water or wind effects",
        "Idle equipment on site",
        "Crew present but not working",
        "Protected materials",
        "Work area conditions"
      ]
    }
  },
  
  common_mistakes: {
    rejected_claims: [
      {
        mistake: "Generic crew counts",
        fix: "List individual names and rates"
      },
      {
        mistake: "No equipment documentation", 
        fix: "Include all idled equipment with standby rates"
      },
      {
        mistake: "Weather station too far",
        fix: "Must be within 10 miles, verify distance"
      },
      {
        mistake: "Missing photos",
        fix: "Take photos during the delay, not after"
      },
      {
        mistake: "Vague delay reasons",
        fix: "Specify exact weather conditions and safety concerns"
      },
      {
        mistake: "Math errors",
        fix: "Double-check all calculations, use burden rates"
      }
    ]
  }
}

// Helper function to get tooltip for specific field
export function getTooltip(category: string, field: string): string {
  const path = category.split('.')
  let current: any = INSURANCE_GUIDANCE
  
  for (const key of path) {
    current = current?.[key]
  }
  
  return current?.tooltip || ''
}

// Get burden rate with explanation
export function getBurdenRateInfo() {
  return {
    rate: INSURANCE_GUIDANCE.crew.burdenRate.default,
    tooltip: INSURANCE_GUIDANCE.crew.burdenRate.tooltip,
    breakdown: INSURANCE_GUIDANCE.crew.burdenRate.breakdown
  }
}

// Get standby rate guidance
export function getStandbyRateInfo(equipmentType: 'owned' | 'rented' | 'specialized' = 'owned') {
  const rates = {
    owned: 0.5,
    rented: 1.0,
    specialized: 0.65
  }
  
  return {
    rate: rates[equipmentType],
    tooltip: INSURANCE_GUIDANCE.equipment.standbyRates.tooltip,
    guidelines: INSURANCE_GUIDANCE.equipment.standbyRates.guidelines
  }
}