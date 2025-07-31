// CSV Import/Export Service for Equipment, Crew, and Projects

import { parse } from 'csv-parse/browser/esm/sync'
import { stringify } from 'csv-stringify/browser/esm/sync'

// Sample data templates
export const sampleTemplates = {
  equipment: {
    headers: ['name', 'type', 'model', 'serial_number', 'hourly_rate', 'daily_rate', 'status', 'location', 'notes'],
    rows: [
      ['Excavator CAT 320', 'Excavator', '320D', 'CAT320-12345', '150', '1200', 'available', 'Main Yard', 'Good condition'],
      ['Crane 50T', 'Crane', 'Grove GMK3050', 'GRV-50T-98765', '300', '2400', 'available', 'Site A', 'Certified until 2025'],
      ['Concrete Mixer', 'Mixer', 'SANY SY5310', 'SANY-MX-54321', '85', '680', 'in_use', 'Site B', 'Regular maintenance required'],
      ['Bulldozer D6', 'Bulldozer', 'CAT D6', 'CAT-D6-11111', '125', '1000', 'maintenance', 'Repair Shop', 'Track replacement'],
      ['Dump Truck 1', 'Truck', 'Volvo FMX', 'VOL-FMX-22222', '75', '600', 'available', 'Main Yard', '10 cubic meter capacity']
    ]
  },
  crew: {
    headers: ['name', 'role', 'email', 'phone', 'hourly_rate', 'certifications', 'emergency_contact', 'emergency_phone', 'status'],
    rows: [
      ['John Smith', 'Foreman', 'john.smith@construction.com', '555-0101', '85', 'OSHA 30, First Aid', 'Jane Smith', '555-0102', 'active'],
      ['Mike Johnson', 'Operator', 'mike.j@construction.com', '555-0103', '65', 'Heavy Equipment, OSHA 10', 'Sarah Johnson', '555-0104', 'active'],
      ['David Williams', 'Carpenter', 'david.w@construction.com', '555-0105', '55', 'OSHA 10', 'Lisa Williams', '555-0106', 'active'],
      ['Robert Brown', 'Electrician', 'robert.b@construction.com', '555-0107', '70', 'Master Electrician, OSHA 10', 'Mary Brown', '555-0108', 'active'],
      ['James Davis', 'Laborer', 'james.d@construction.com', '555-0109', '35', 'OSHA 10', 'Patricia Davis', '555-0110', 'on_leave']
    ]
  },
  projects: {
    headers: ['name', 'address', 'city', 'state', 'zip', 'latitude', 'longitude', 'start_date', 'end_date', 'project_type', 'contract_number', 'general_contractor', 'insurance_policy_number', 'crew_size', 'hourly_rate', 'daily_overhead', 'wind_speed_threshold', 'precipitation_threshold', 'temp_min', 'temp_max'],
    rows: [
      ['Downtown Office Complex', '123 Main St', 'Seattle', 'WA', '98101', '47.6062', '-122.3321', '2024-01-15', '2024-12-31', 'commercial', 'DOC-2024-001', 'ABC Construction', 'INS-123456', '25', '75', '1500', '25', '0.25', '32', '95'],
      ['Residential Development', '456 Oak Ave', 'Portland', 'OR', '97204', '45.5152', '-122.6784', '2024-02-01', '2024-10-30', 'residential', 'RES-2024-002', 'XYZ Builders', 'INS-234567', '15', '65', '1000', '20', '0.20', '35', '90'],
      ['Hospital Renovation', '789 Medical Way', 'San Francisco', 'CA', '94102', '37.7749', '-122.4194', '2024-03-01', '2025-03-01', 'healthcare', 'HOS-2024-003', 'Healthcare Constructors', 'INS-345678', '30', '80', '2000', '30', '0.30', '40', '85'],
      ['School Addition', '321 Education Blvd', 'Los Angeles', 'CA', '90012', '34.0522', '-118.2437', '2024-04-01', '2024-09-01', 'education', 'SCH-2024-004', 'Education Builders', 'INS-456789', '20', '70', '1200', '25', '0.15', '45', '100'],
      ['Bridge Repair', 'Highway 101', 'Sacramento', 'CA', '95814', '38.5816', '-121.4944', '2024-05-01', '2024-08-31', 'infrastructure', 'BRG-2024-005', 'Infrastructure Corp', 'INS-567890', '10', '85', '2500', '35', '0.10', '32', '105']
    ]
  }
}

// CSV Parser with validation
export class CSVImporter {
  static async parseCSV(fileContent: string, type: 'equipment' | 'crew' | 'projects'): Promise<{
    success: boolean
    data?: any[]
    errors?: string[]
  }> {
    try {
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        cast: true,
        cast_date: false
      })
      
      // Validate records based on type
      const validation = this.validateRecords(records, type)
      
      if (validation.errors.length > 0) {
        return {
          success: false,
          errors: validation.errors
        }
      }
      
      // Transform data for database
      const transformedData = this.transformData(records, type)
      
      return {
        success: true,
        data: transformedData
      }
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to parse CSV']
      }
    }
  }
  
  private static validateRecords(records: any[], type: string): { errors: string[] } {
    const errors: string[] = []
    const requiredFields = this.getRequiredFields(type)
    
    records.forEach((record, index) => {
      requiredFields.forEach(field => {
        if (!record[field] || record[field] === '') {
          errors.push(`Row ${index + 2}: Missing required field "${field}"`)
        }
      })
      
      // Type-specific validation
      if (type === 'equipment' && record.hourly_rate && isNaN(parseFloat(record.hourly_rate))) {
        errors.push(`Row ${index + 2}: Invalid hourly rate`)
      }
      
      if (type === 'crew' && record.email && !this.isValidEmail(record.email)) {
        errors.push(`Row ${index + 2}: Invalid email format`)
      }
      
      if (type === 'projects') {
        if (record.latitude && (isNaN(parseFloat(record.latitude)) || Math.abs(parseFloat(record.latitude)) > 90)) {
          errors.push(`Row ${index + 2}: Invalid latitude`)
        }
        if (record.longitude && (isNaN(parseFloat(record.longitude)) || Math.abs(parseFloat(record.longitude)) > 180)) {
          errors.push(`Row ${index + 2}: Invalid longitude`)
        }
        if (record.start_date && !this.isValidDate(record.start_date)) {
          errors.push(`Row ${index + 2}: Invalid start date (use YYYY-MM-DD format)`)
        }
      }
    })
    
    return { errors }
  }
  
  private static getRequiredFields(type: string): string[] {
    switch (type) {
      case 'equipment':
        return ['name', 'type', 'status']
      case 'crew':
        return ['name', 'role', 'hourly_rate']
      case 'projects':
        return ['name', 'address', 'latitude', 'longitude', 'start_date']
      default:
        return []
    }
  }
  
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
  
  private static isValidDate(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) return false
    const d = new Date(date)
    return d instanceof Date && !isNaN(d.getTime())
  }
  
  private static transformData(records: any[], type: string): any[] {
    switch (type) {
      case 'equipment':
        return records.map(record => ({
          name: record.name,
          type: record.type,
          model: record.model || null,
          serial_number: record.serial_number || null,
          hourly_rate: parseFloat(record.hourly_rate) || 0,
          daily_rate: parseFloat(record.daily_rate) || 0,
          status: record.status || 'available',
          location: record.location || null,
          notes: record.notes || null
        }))
      
      case 'crew':
        return records.map(record => ({
          name: record.name,
          role: record.role,
          email: record.email || null,
          phone: record.phone || null,
          hourly_rate: parseFloat(record.hourly_rate) || 0,
          certifications: record.certifications ? record.certifications.split(',').map((c: string) => c.trim()) : [],
          emergency_contact_name: record.emergency_contact || null,
          emergency_contact_phone: record.emergency_phone || null,
          status: record.status || 'active'
        }))
      
      case 'projects':
        return records.map(record => ({
          name: record.name,
          address: `${record.address}, ${record.city}, ${record.state} ${record.zip}`,
          latitude: parseFloat(record.latitude),
          longitude: parseFloat(record.longitude),
          start_date: record.start_date,
          end_date: record.end_date || null,
          project_type: record.project_type || 'general',
          contract_number: record.contract_number || null,
          general_contractor: record.general_contractor || null,
          insurance_policy_number: record.insurance_policy_number || null,
          crew_size: parseInt(record.crew_size) || 10,
          hourly_rate: parseFloat(record.hourly_rate) || 75,
          daily_overhead: parseFloat(record.daily_overhead) || 1000,
          weather_thresholds: {
            wind_speed: parseFloat(record.wind_speed_threshold) || 25,
            precipitation: parseFloat(record.precipitation_threshold) || 0.25,
            temperature_min: parseFloat(record.temp_min) || 32,
            temperature_max: parseFloat(record.temp_max) || 95
          }
        }))
      
      default:
        return records
    }
  }
}

// CSV Exporter
export class CSVExporter {
  static generateSampleCSV(type: 'equipment' | 'crew' | 'projects'): string {
    const template = sampleTemplates[type]
    return stringify([template.headers, ...template.rows], {
      header: false
    })
  }
  
  static exportToCSV(data: any[], type: 'equipment' | 'crew' | 'projects'): string {
    const headers = sampleTemplates[type].headers
    const rows = data.map(item => this.mapDataToRow(item, type, headers))
    
    return stringify([headers, ...rows], {
      header: false
    })
  }
  
  private static mapDataToRow(item: any, type: string, headers: string[]): any[] {
    const row: any[] = []
    
    headers.forEach(header => {
      switch (type) {
        case 'equipment':
          row.push(this.getEquipmentValue(item, header))
          break
        case 'crew':
          row.push(this.getCrewValue(item, header))
          break
        case 'projects':
          row.push(this.getProjectValue(item, header))
          break
      }
    })
    
    return row
  }
  
  private static getEquipmentValue(item: any, field: string): any {
    switch (field) {
      case 'name': return item.name || ''
      case 'type': return item.type || ''
      case 'model': return item.model || ''
      case 'serial_number': return item.serial_number || ''
      case 'hourly_rate': return item.hourly_rate || ''
      case 'daily_rate': return item.daily_rate || ''
      case 'status': return item.status || ''
      case 'location': return item.location || ''
      case 'notes': return item.notes || ''
      default: return ''
    }
  }
  
  private static getCrewValue(item: any, field: string): any {
    switch (field) {
      case 'name': return item.name || ''
      case 'role': return item.role || ''
      case 'email': return item.email || ''
      case 'phone': return item.phone || ''
      case 'hourly_rate': return item.hourly_rate || ''
      case 'certifications': return Array.isArray(item.certifications) ? item.certifications.join(', ') : ''
      case 'emergency_contact': return item.emergency_contact_name || ''
      case 'emergency_phone': return item.emergency_contact_phone || ''
      case 'status': return item.status || ''
      default: return ''
    }
  }
  
  private static getProjectValue(item: any, field: string): any {
    // Parse address if it's a full address string
    const addressParts = item.address ? item.address.split(',').map((s: string) => s.trim()) : []
    
    switch (field) {
      case 'name': return item.name || ''
      case 'address': return addressParts[0] || ''
      case 'city': return addressParts[1] || ''
      case 'state': return addressParts[2]?.split(' ')[0] || ''
      case 'zip': return addressParts[2]?.split(' ')[1] || ''
      case 'latitude': return item.latitude || ''
      case 'longitude': return item.longitude || ''
      case 'start_date': return item.start_date || ''
      case 'end_date': return item.end_date || ''
      case 'project_type': return item.project_type || ''
      case 'contract_number': return item.contract_number || ''
      case 'general_contractor': return item.general_contractor || ''
      case 'insurance_policy_number': return item.insurance_policy_number || ''
      case 'crew_size': return item.crew_size || ''
      case 'hourly_rate': return item.hourly_rate || ''
      case 'daily_overhead': return item.daily_overhead || ''
      case 'wind_speed_threshold': return item.weather_thresholds?.wind_speed || ''
      case 'precipitation_threshold': return item.weather_thresholds?.precipitation || ''
      case 'temp_min': return item.weather_thresholds?.temperature_min || ''
      case 'temp_max': return item.weather_thresholds?.temperature_max || ''
      default: return ''
    }
  }
  
  // Helper to download CSV file
  static downloadCSV(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }
}