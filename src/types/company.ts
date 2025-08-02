export interface Company {
  id: string
  name: string
  legal_name?: string
  tax_id?: string
  logo_url?: string
  website?: string
  email?: string
  phone?: string
  fax?: string
  
  // Address
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
  
  // Business details
  license_number?: string
  insurance_carrier?: string
  insurance_policy_number?: string
  insurance_expiry?: string
  bonding_company?: string
  bonding_number?: string
  bonding_limit?: number
  
  // Settings
  timezone?: string
  currency?: string
  fiscal_year_start?: number
  
  // Metadata
  created_at: string
  updated_at: string
  created_by?: string
  is_active: boolean
  parent_company_id?: string
  company_type: 'contractor' | 'subcontractor' | 'client' | 'supplier'
}

export interface UserProfile {
  id: string
  company_id?: string
  
  // Personal information
  first_name?: string
  last_name?: string
  display_name?: string
  phone?: string
  mobile_phone?: string
  
  // Professional information
  job_title?: string
  department?: string
  employee_id?: string
  license_number?: string
  license_state?: string
  license_expiry?: string
  
  // Settings and preferences
  avatar_url?: string
  notification_preferences?: {
    email: boolean
    sms: boolean
    in_app: boolean
  }
  ui_preferences?: Record<string, any>
  
  // Permissions and roles
  role: 'owner' | 'admin' | 'manager' | 'user' | 'viewer'
  permissions?: string[]
  
  // Status
  is_active: boolean
  last_login_at?: string
  
  // Metadata
  created_at: string
  updated_at: string
}

export interface CompanyUser {
  id: string
  company_id: string
  user_id: string
  role: string
  permissions?: string[]
  start_date?: string
  end_date?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserWithCompany {
  id: string
  email: string
  user_created_at: string
  first_name?: string
  last_name?: string
  display_name?: string
  phone?: string
  job_title?: string
  role: string
  is_active: boolean
  company_id?: string
  company_name?: string
  company_logo?: string
}