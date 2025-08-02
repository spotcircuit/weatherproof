// Task-related types for project task management

export type TaskType = 
  | 'mobilization'
  | 'site_prep'
  | 'demolition'
  | 'tear_off'
  | 'deck_repair'
  | 'underlayment'
  | 'insulation'
  | 'waterproofing'
  | 'torch_weld'
  | 'membrane_install'
  | 'flashing'
  | 'sealing'
  | 'inspection'
  | 'cleanup'
  | 'framing'
  | 'concrete_pour'
  | 'concrete_finish'
  | 'rebar_install'
  | 'forming'
  | 'excavation'
  | 'backfill'
  | 'grading';

export type TaskStatus = 'pending' | 'in_progress' | 'on_track' | 'at_risk' | 'delayed' | 'completed' | 'cancelled';

export type DelayCategory = 'weather' | 'equipment' | 'crew' | 'material' | 'other';

export interface WeatherThresholds {
  wind_speed?: number;
  precipitation?: number;
  temperature_min?: number;
  temperature_max?: number;
  humidity_max?: number;
  visibility_min?: number;
}

export interface ProjectTask {
  id: string;
  project_id: string;
  name: string;
  type: TaskType;
  description?: string;
  sequence_order: number;
  
  // Timing
  expected_start?: string;
  expected_end?: string;
  expected_duration_days: number;
  actual_start?: string;
  actual_end?: string;
  
  // Weather sensitivity
  weather_sensitive: boolean;
  weather_thresholds?: WeatherThresholds;
  forecast_delay_risk: boolean;
  
  // Status
  status: TaskStatus;
  delayed_today: boolean;
  delay_reason?: string;
  total_delay_days: number;
  delay_days: number;
  completion_variance_pct: number;
  
  // Resources (counts only, actual assignments in separate tables)
  crew_count: number;
  equipment_count: number;
  
  // Progress
  progress_percentage: number;
  
  // Dependencies
  depends_on: string[];
  blocks: string[];
  blocking_task_id?: string;
  
  // Financial
  cost_impact?: number;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
  last_delay_evaluation?: string;
}

export interface TaskDailyLog {
  id: string;
  task_id: string;
  log_date: string;
  
  // Delay tracking
  delayed: boolean;
  delay_reason?: string;
  delay_category?: DelayCategory;
  
  // Weather snapshot
  weather_snapshot?: {
    temperature?: number;
    wind_speed?: number;
    precipitation?: number;
    conditions?: string;
    humidity?: number;
    visibility?: number;
  };
  
  // Work details
  work_completed?: string;
  crew_present: string[];
  equipment_used: string[];
  hours_worked: number;
  progress_made: number;
  
  // Documentation
  notes?: string;
  photos: string[];
  
  // Metadata
  created_at: string;
  created_by?: string;
}

export interface TaskTemplate {
  id: string;
  project_type: string;
  task_name: string;
  task_type: TaskType;
  sequence_order: number;
  typical_duration_days: number;
  weather_sensitive: boolean;
  weather_thresholds?: WeatherThresholds;
  typical_crew_size: number;
  typical_equipment: string[];
  depends_on_sequence: number[];
}

export interface TaskGenerationResult {
  project: {
    id: string;
    name: string;
    type: string;
    weather_today: {
      wind?: number;
      rain?: number;
      temperature?: number;
      conditions?: string;
    };
    weather_thresholds: WeatherThresholds;
    tasks_affected_by_weather: string[];
  };
  tasks: ProjectTask[];
}

// Task crew assignment types
export interface TaskCrewAssignment {
  id: string;
  task_id: string;
  crew_member_id?: string;
  
  // Outsourced crew details
  is_outsourced: boolean;
  outsource_company_name?: string;
  outsource_crew_size?: number;
  outsource_contact_name?: string;
  outsource_contact_phone?: string;
  outsource_rate_type?: 'hourly' | 'daily' | 'fixed';
  outsource_rate?: number;
  
  // Assignment details
  assigned_date: string;
  assigned_by?: string;
  role?: string;
  
  // Status
  status: 'assigned' | 'confirmed' | 'on_site' | 'completed';
  actual_hours_worked?: number;
  
  // Metadata
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Task equipment assignment types
export interface TaskEquipmentAssignment {
  id: string;
  task_id: string;
  equipment_id?: string;
  
  // Rental details
  is_rented: boolean;
  rental_company_name?: string;
  rental_equipment_type?: string;
  rental_rate_type?: 'hourly' | 'daily' | 'weekly';
  rental_rate?: number;
  rental_start_date?: string;
  rental_end_date?: string;
  
  // Assignment details
  assigned_date: string;
  assigned_by?: string;
  quantity: number;
  
  // Usage tracking
  actual_hours_used?: number;
  fuel_consumption?: number;
  maintenance_notes?: string;
  
  // Status
  status: 'assigned' | 'delivered' | 'in_use' | 'returned';
  
  // Metadata
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Task with full resource assignments
export interface TaskWithAssignments extends ProjectTask {
  crew_assignments?: TaskCrewAssignment[];
  equipment_assignments?: TaskEquipmentAssignment[];
  daily_logs?: TaskDailyLog[];
}

// Subcontractor task update submission
export interface SubcontractorTaskUpdate {
  id: string;
  task_id: string;
  update_token: string;
  
  // Update details
  progress_percentage?: number;
  status_update?: TaskStatus;
  delay_reason?: string;
  delay_category?: DelayCategory;
  crew_size_present?: number;
  hours_worked?: number;
  
  // Evidence
  notes?: string;
  photos?: string[];
  weather_conditions?: string;
  
  // Metadata
  submitted_at: string;
  submitted_by_name?: string;
  submitted_by_phone?: string;
  ip_address?: string;
  is_processed: boolean;
  processed_at?: string;
  expires_at: string;
}

// Task delay analytics view
export interface TaskDelayAnalytics {
  task_id: string;
  task_name: string;
  task_type: TaskType;
  status: TaskStatus;
  delay_days: number;
  completion_variance_pct: number;
  forecast_delay_risk: boolean;
  weather_sensitive: boolean;
  delayed_today: boolean;
  total_delay_days: number;
  delay_reason?: string;
  cost_impact?: number;
  
  // Project info
  project_id: string;
  project_name: string;
  project_type: string;
  company_id: string;
  company_name: string;
  
  // Resource counts
  total_crew_assignments: number;
  outsourced_crews: number;
  total_crew_size: number;
  total_equipment_assignments: number;
  rented_equipment: number;
  
  // Daily logs
  total_daily_logs: number;
  delay_logs: number;
  
  // Latest weather
  latest_temperature?: number;
  latest_wind_speed?: number;
  latest_precipitation?: number;
  latest_conditions?: string[];
}