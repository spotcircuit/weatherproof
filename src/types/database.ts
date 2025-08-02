// Database types for Supabase

export interface User {
  id: string
  email: string
  name: string | null
  company: string | null
  phone: string | null
  role: 'CONTRACTOR' | 'PROJECT_MANAGER' | 'ADMIN' | 'INSURANCE_AGENT'
  notification_preferences: {
    email: boolean
    sms: boolean
    push: boolean
  }
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  user_id: string
  company_id?: string
  name: string
  description: string | null
  address: string
  latitude: number
  longitude: number
  timezone?: string
  start_date: string
  end_date: string | null
  active: boolean
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  project_type: string
  crew_size: number
  hourly_rate: number
  daily_overhead: number
  external_id: string | null
  external_source: string | null
  metadata: any
  created_at: string
  updated_at: string
  deadline_date?: string | null
  deadline_type?: 'contract' | 'milestone' | 'weather_window' | 'permit_expiry' | 'insurance_claim' | 'other' | null
  deadline_notes?: string | null
}

export interface WeatherReading {
  id: string
  project_id: string
  timestamp: string
  temperature: number | null
  wind_speed: number | null
  precipitation: number | null
  humidity: number | null
  pressure: number | null
  visibility: number | null
  conditions: string | null
  source: string
  station_id: string | null
  station_distance: number | null
  raw_data: any
  created_at: string
}

export interface DelayEvent {
  id: string
  project_id: string
  start_time: string
  end_time: string | null
  duration_hours: number | null
  weather_condition: string
  threshold_violated: any
  affected_activities: string[]
  estimated_cost: number | null
  labor_hours_lost: number | null
  crew_size: number | null
  labor_cost: number | null
  equipment_cost: number | null
  overhead_cost: number | null
  total_cost: number | null
  auto_generated: boolean
  verified: boolean
  verified_by: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Report {
  id: string
  project_id: string
  user_id: string
  report_type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'INSURANCE_CLAIM' | 'CUSTOM'
  period_start: string
  period_end: string
  document_url: string | null
  csv_url: string | null
  metadata: any
  total_delay_hours: number | null
  total_cost: number | null
  status: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED'
  claim_amount: number | null
  policy_number: string | null
  insurer_name: string | null
  submitted_at: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

export interface Alert {
  id: string
  project_id: string
  user_id: string
  type: 'WEATHER_WARNING' | 'DELAY_DETECTED' | 'DELAY_ENDED' | 'THRESHOLD_APPROACHING' | 'REPORT_READY'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  message: string
  weather_data: any
  sent: boolean
  sent_at: string | null
  read: boolean
  read_at: string | null
  created_at: string
}

export interface DashboardStats {
  user_id: string
  total_projects: number
  active_projects: number
  total_delays: number
  total_delay_cost: number
  total_hours_lost: number
  total_reports: number
  completed_reports: number
}