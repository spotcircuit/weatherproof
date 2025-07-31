// Base Report Generator Class

import { jsPDF } from 'jspdf'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase'

export interface ReportData {
  project: any
  delays: any[]
  weather: any[]
  costs: any
  crew?: any[]
  equipment?: any[]
  photos?: any[]
  company: any
  recipient?: any
  customData?: Record<string, any>
}

export interface GeneratorOptions {
  includePhotos?: boolean
  includeWeatherMaps?: boolean
  includeHistorical?: boolean
  groupByEvent?: boolean
  language?: 'en' | 'es'
}

export abstract class BaseReportGenerator {
  protected doc: jsPDF
  protected supabase: ReturnType<typeof createClient>
  protected data!: ReportData
  protected options!: GeneratorOptions
  protected currentY: number = 20
  protected pageNumber: number = 1
  
  constructor() {
    this.doc = new jsPDF()
    this.supabase = createClient()
  }
  
  // Abstract methods that each generator must implement
  abstract generateReport(data: ReportData, options?: GeneratorOptions): Promise<Blob>
  abstract getReportTitle(): string
  abstract getReportType(): string
  
  // Common utility methods
  protected async fetchProjectData(projectId: string) {
    const { data, error } = await this.supabase
      .from('projects')
      .select(`
        *,
        users (*)
      `)
      .eq('id', projectId)
      .single()
    
    if (error) throw error
    return data
  }
  
  protected async fetchDelayEvents(projectId: string, startDate: Date, endDate: Date) {
    const { data, error } = await this.supabase
      .from('delay_events')
      .select(`
        *,
        weather_readings (*)
      `)
      .eq('project_id', projectId)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .order('start_time', { ascending: true })
    
    if (error) throw error
    return data
  }
  
  protected async fetchWeatherData(projectId: string, startDate: Date, endDate: Date) {
    const { data, error } = await this.supabase
      .from('weather_readings')
      .select('*')
      .eq('project_id', projectId)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp', { ascending: true })
    
    if (error) throw error
    return data
  }
  
  protected async fetchPhotos(delayIds: string[]) {
    if (!delayIds.length) return []
    
    const { data, error } = await this.supabase
      .from('photos')
      .select('*')
      .in('delay_event_id', delayIds)
      .order('taken_at', { ascending: true })
    
    if (error) throw error
    return data
  }
  
  // Common header/footer methods
  protected addHeader(title: string, subtitle?: string) {
    this.doc.setFontSize(20)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(title, 105, this.currentY, { align: 'center' })
    
    if (subtitle) {
      this.currentY += 10
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(subtitle, 105, this.currentY, { align: 'center' })
    }
    
    this.currentY += 15
  }
  
  protected addFooter() {
    const pageCount = this.doc.getNumberOfPages()
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)
      this.doc.setFontSize(8)
      this.doc.setFont('helvetica', 'normal')
      
      // Add page numbers
      this.doc.text(`Page ${i} of ${pageCount}`, 195, 285, { align: 'right' })
      
      // Add timestamp
      this.doc.text(
        `Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`,
        15, 285
      )
      
      // Add branding
      this.doc.text(
        'WeatherProof - Construction Weather Documentation',
        105, 285,
        { align: 'center' }
      )
    }
  }
  
  protected addSectionHeader(title: string) {
    if (this.currentY > 250) {
      this.addNewPage()
    }
    
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(title, 15, this.currentY)
    this.currentY += 10
  }
  
  protected addNewPage() {
    this.doc.addPage()
    this.currentY = 20
    this.pageNumber++
  }
  
  protected checkPageBreak(neededSpace: number = 30) {
    if (this.currentY + neededSpace > 270) {
      this.addNewPage()
    }
  }
  
  // Common data formatting methods
  protected formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }
  
  protected formatDate(date: string | Date, formatStr: string = 'MMM dd, yyyy'): string {
    return format(new Date(date), formatStr)
  }
  
  protected calculateTotalCosts(delays: any[]): {
    labor: number
    equipment: number
    overhead: number
    total: number
  } {
    return delays.reduce((acc, delay) => ({
      labor: acc.labor + (delay.labor_cost || 0),
      equipment: acc.equipment + (delay.equipment_cost || 0),
      overhead: acc.overhead + (delay.overhead_cost || 0),
      total: acc.total + (delay.total_cost || 0)
    }), { labor: 0, equipment: 0, overhead: 0, total: 0 })
  }
  
  // Weather threshold checking
  protected checkThresholdViolations(weather: any, thresholds: any): string[] {
    const violations = []
    
    if (thresholds.wind_speed && weather.wind_speed > thresholds.wind_speed) {
      violations.push(`Wind: ${weather.wind_speed} mph exceeds ${thresholds.wind_speed} mph`)
    }
    
    if (thresholds.precipitation && weather.precipitation > thresholds.precipitation) {
      violations.push(`Rain: ${weather.precipitation}" exceeds ${thresholds.precipitation}"`)
    }
    
    if (thresholds.temperature_min && weather.temperature < thresholds.temperature_min) {
      violations.push(`Temp: ${weather.temperature}°F below ${thresholds.temperature_min}°F`)
    }
    
    if (thresholds.temperature_max && weather.temperature > thresholds.temperature_max) {
      violations.push(`Temp: ${weather.temperature}°F above ${thresholds.temperature_max}°F`)
    }
    
    return violations
  }
  
  // Common components
  protected addProjectInfo(project: any) {
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    
    const info = [
      ['Project:', project.name],
      ['Location:', project.address],
      ['Contract #:', project.contract_number || 'N/A'],
      ['Start Date:', this.formatDate(project.start_date)],
      ['End Date:', project.end_date ? this.formatDate(project.end_date) : 'Ongoing']
    ]
    
    info.forEach(([label, value]) => {
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(label, 15, this.currentY)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(value, 50, this.currentY)
      this.currentY += 7
    })
  }
  
  protected addCostSummaryTable(costs: any) {
    this.checkPageBreak(50)
    
    this.addSectionHeader('Cost Summary')
    
    const tableData = [
      ['Category', 'Amount'],
      ['Labor Costs', this.formatCurrency(costs.labor)],
      ['Equipment Costs', this.formatCurrency(costs.equipment)],
      ['Overhead Costs', this.formatCurrency(costs.overhead)],
      ['Total Impact', this.formatCurrency(costs.total)]
    ]
    
    // Simple table rendering
    const startX = 15
    const colWidth = 90
    
    tableData.forEach((row, index) => {
      const isHeader = index === 0
      const isTotal = index === tableData.length - 1
      
      if (isHeader) {
        this.doc.setFont('helvetica', 'bold')
        this.doc.setFillColor(240, 240, 240)
        this.doc.rect(startX, this.currentY - 5, 180, 10, 'F')
      } else if (isTotal) {
        this.doc.setFont('helvetica', 'bold')
        this.doc.setFillColor(250, 250, 250)
        this.doc.rect(startX, this.currentY - 5, 180, 10, 'F')
      } else {
        this.doc.setFont('helvetica', 'normal')
      }
      
      this.doc.text(row[0], startX + 5, this.currentY)
      this.doc.text(row[1], startX + colWidth + 5, this.currentY, { align: 'right' })
      
      this.currentY += 10
    })
    
    this.currentY += 10
  }
  
  // Save report to database
  protected async saveReport(
    projectId: string,
    reportType: string,
    reportBlob: Blob,
    metadata: any
  ) {
    // Convert blob to base64 for storage
    const buffer = await reportBlob.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    
    const { data, error } = await this.supabase
      .from('reports')
      .insert({
        project_id: projectId,
        report_type: reportType,
        status: 'COMPLETED',
        metadata: {
          ...metadata,
          generated_at: new Date().toISOString(),
          generator: this.constructor.name
        },
        // In production, upload to storage instead
        document_url: `data:application/pdf;base64,${base64}`
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}