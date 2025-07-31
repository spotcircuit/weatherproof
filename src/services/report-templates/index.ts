// Report Template System - Central registry of all report types

export interface ReportTemplate {
  id: string
  name: string
  description: string
  category: 'contractor' | 'insurance' | 'client' | 'specialized'
  recipient: string
  icon: string
  features: string[]
  dataRequirements: string[]
  outputFormats: ('pdf' | 'csv' | 'xlsx' | 'email')[]
  generator: string // Points to specific generator class
}

export const reportTemplates: ReportTemplate[] = [
  // Contractor Reports
  {
    id: 'daily-weather-log',
    name: 'Daily Weather Log',
    description: 'Simple conditions + work status for daily tracking',
    category: 'contractor',
    recipient: 'Internal Teams',
    icon: 'Calendar',
    features: ['Quick entry', 'Mobile friendly', 'Photo support'],
    dataRequirements: ['weather', 'work_status'],
    outputFormats: ['pdf', 'csv'],
    generator: 'DailyWeatherLogGenerator'
  },
  {
    id: 'weekly-weather-summary',
    name: 'Weekly Weather Summary',
    description: 'Overview for project meetings and planning',
    category: 'contractor',
    recipient: 'Project Managers',
    icon: 'CalendarDays',
    features: ['7-day overview', 'Impact summary', 'Next week forecast'],
    dataRequirements: ['weather', 'delays', 'schedule'],
    outputFormats: ['pdf', 'email'],
    generator: 'WeeklySummaryGenerator'
  },
  {
    id: 'monthly-delay-report',
    name: 'Monthly Delay Report',
    description: 'Total impact for invoicing and billing',
    category: 'contractor',
    recipient: 'Accounting',
    icon: 'DollarSign',
    features: ['Cost breakdown', 'Invoice ready', 'Supporting docs'],
    dataRequirements: ['delays', 'costs', 'crew', 'equipment'],
    outputFormats: ['pdf', 'xlsx'],
    generator: 'MonthlyDelayGenerator'
  },
  
  // Insurance Reports
  {
    id: 'insurance-claim',
    name: 'Insurance Claim Documentation',
    description: 'Formal claim with all required attachments',
    category: 'insurance',
    recipient: 'Insurance Company',
    icon: 'FileCheck',
    features: ['ACORD compliant', 'NOAA verified', 'Legal format'],
    dataRequirements: ['delays', 'weather', 'costs', 'photos', 'verification'],
    outputFormats: ['pdf'],
    generator: 'InsuranceClaimGenerator'
  },
  {
    id: 'damage-vs-delay',
    name: 'Damage vs Delay Report',
    description: 'Separate covered and uncovered items',
    category: 'insurance',
    recipient: 'Insurance Adjuster',
    icon: 'Split',
    features: ['Clear categorization', 'Policy mapping', 'Cost allocation'],
    dataRequirements: ['delays', 'damage', 'policy_terms'],
    outputFormats: ['pdf', 'xlsx'],
    generator: 'DamageDelayGenerator'
  },
  {
    id: 'historical-comparison',
    name: 'Historical Weather Analysis',
    description: 'Prove abnormal weather conditions',
    category: 'insurance',
    recipient: 'Insurance Company',
    icon: 'TrendingUp',
    features: ['10-year averages', 'Statistical analysis', 'NOAA data'],
    dataRequirements: ['weather', 'historical_data', 'thresholds'],
    outputFormats: ['pdf'],
    generator: 'HistoricalAnalysisGenerator'
  },
  
  // Client Reports
  {
    id: 'delay-notification',
    name: 'Project Delay Notification',
    description: 'Simple explanation of weather delays',
    category: 'client',
    recipient: 'Property Owner',
    icon: 'AlertTriangle',
    features: ['Plain language', 'Visual timeline', 'Action items'],
    dataRequirements: ['delays', 'schedule'],
    outputFormats: ['pdf', 'email'],
    generator: 'DelayNotificationGenerator'
  },
  {
    id: 'schedule-impact',
    name: 'Schedule Impact Report',
    description: 'Updated completion dates and milestones',
    category: 'client',
    recipient: 'Property Owner',
    icon: 'Clock',
    features: ['Gantt charts', 'Critical path', 'Recovery plan'],
    dataRequirements: ['delays', 'schedule', 'milestones'],
    outputFormats: ['pdf'],
    generator: 'ScheduleImpactGenerator'
  },
  {
    id: 'change-order-justification',
    name: 'Change Order Justification',
    description: 'Support for time extension requests',
    category: 'client',
    recipient: 'Contract Administrator',
    icon: 'FileText',
    features: ['Contract references', 'Weather proof', 'Cost impacts'],
    dataRequirements: ['delays', 'contract', 'weather'],
    outputFormats: ['pdf'],
    generator: 'ChangeOrderGenerator'
  },
  
  // Specialized Reports
  {
    id: 'homeowner-notice',
    name: 'Homeowner Weather Notice',
    description: 'Friendly update for residential clients',
    category: 'specialized',
    recipient: 'Homeowner',
    icon: 'Home',
    features: ['Simple language', 'Photos', 'What to expect'],
    dataRequirements: ['delays', 'schedule', 'photos'],
    outputFormats: ['pdf', 'email'],
    generator: 'HomeownerNoticeGenerator'
  },
  {
    id: 'hoa-report',
    name: 'HOA/Property Management Report',
    description: 'Multi-unit weather impact summary',
    category: 'specialized',
    recipient: 'HOA Board',
    icon: 'Building2',
    features: ['Unit breakdown', 'Common areas', 'Timeline'],
    dataRequirements: ['delays', 'units', 'schedule'],
    outputFormats: ['pdf', 'xlsx'],
    generator: 'HOAReportGenerator'
  },
  {
    id: 'legal-litigation',
    name: 'Legal/Litigation Report',
    description: 'Court-admissible weather documentation',
    category: 'specialized',
    recipient: 'Legal Team',
    icon: 'Scale',
    features: ['Sworn statements', 'Chain of custody', 'Expert format'],
    dataRequirements: ['delays', 'weather', 'verification', 'signatures'],
    outputFormats: ['pdf'],
    generator: 'LegalReportGenerator'
  },
  {
    id: 'bank-draw-impact',
    name: 'Bank Draw Impact Report',
    description: 'Weather delays affecting loan draws',
    category: 'specialized',
    recipient: 'Lender',
    icon: 'Building',
    features: ['Draw schedule', 'Completion %', 'Mitigation plan'],
    dataRequirements: ['delays', 'draw_schedule', 'costs'],
    outputFormats: ['pdf'],
    generator: 'BankDrawGenerator'
  },
  {
    id: 'government-compliance',
    name: 'Government/Public Works Report',
    description: 'Compliance documentation for public projects',
    category: 'specialized',
    recipient: 'Government Agency',
    icon: 'Building',
    features: ['Regulatory format', 'Certified data', 'Audit trail'],
    dataRequirements: ['delays', 'weather', 'compliance_docs'],
    outputFormats: ['pdf', 'csv'],
    generator: 'GovernmentReportGenerator'
  },
  {
    id: 'realtime-alert',
    name: 'Real-Time Weather Alert',
    description: 'Predictive warnings for upcoming weather',
    category: 'specialized',
    recipient: 'All Stakeholders',
    icon: 'AlertCircle',
    features: ['SMS/Email', 'Forecast', 'Action items'],
    dataRequirements: ['forecast', 'thresholds'],
    outputFormats: ['email'],
    generator: 'RealtimeAlertGenerator'
  },
  {
    id: 'subcontractor-coordination',
    name: 'Subcontractor Schedule Update',
    description: 'Weather impact on sub schedules',
    category: 'specialized',
    recipient: 'Subcontractors',
    icon: 'Users',
    features: ['Trade specific', 'New dates', 'Contact info'],
    dataRequirements: ['delays', 'schedule', 'subs'],
    outputFormats: ['pdf', 'email'],
    generator: 'SubcontractorUpdateGenerator'
  },
  {
    id: 'crew-utilization',
    name: 'Crew Utilization Report',
    description: 'Track who worked when and idle time',
    category: 'contractor',
    recipient: 'HR/Payroll',
    icon: 'Users',
    features: ['Individual tracking', 'Hours summary', 'Cost impact'],
    dataRequirements: ['crew_assignments', 'delays', 'timesheets'],
    outputFormats: ['pdf', 'xlsx'],
    generator: 'CrewUtilizationGenerator'
  },
  {
    id: 'equipment-idle-time',
    name: 'Equipment Idle Time Report',
    description: 'Rental cost implications of weather delays',
    category: 'contractor',
    recipient: 'Equipment Manager',
    icon: 'Truck',
    features: ['Standby costs', 'Utilization %', 'Return decisions'],
    dataRequirements: ['equipment_assignments', 'delays', 'rental_rates'],
    outputFormats: ['pdf', 'xlsx'],
    generator: 'EquipmentIdleGenerator'
  }
]

// Helper functions
export function getTemplateById(id: string): ReportTemplate | undefined {
  return reportTemplates.find(t => t.id === id)
}

export function getTemplatesByCategory(category: string): ReportTemplate[] {
  return reportTemplates.filter(t => t.category === category)
}

export function getTemplatesForRecipient(recipient: string): ReportTemplate[] {
  return reportTemplates.filter(t => 
    t.recipient.toLowerCase().includes(recipient.toLowerCase())
  )
}

// Report builder configuration
export interface ReportBuilderConfig {
  templateId: string
  projectId: string
  dateRange: {
    start: Date
    end: Date
  }
  options?: {
    includePhotos?: boolean
    includeWeatherMaps?: boolean
    includeHistorical?: boolean
    groupByEvent?: boolean
    language?: 'en' | 'es'
  }
  recipient?: {
    name: string
    email?: string
    company?: string
  }
  customData?: Record<string, any>
}