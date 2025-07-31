// Report Factory - Creates appropriate report generators

import { BaseReportGenerator } from './base-generator'
import { DailyWeatherLogGenerator } from './generators/daily-weather-log'
import { DelayNotificationGenerator } from './generators/delay-notification'
import { reportGenerator } from '../report-generator' // Existing insurance report generator
import { getTemplateById } from './index'

// Map of generator classes
const generatorMap: Record<string, any> = {
  'DailyWeatherLogGenerator': DailyWeatherLogGenerator,
  'DelayNotificationGenerator': DelayNotificationGenerator,
  // Add more generators as they're created
}

export class ReportFactory {
  static async createGenerator(templateId: string): Promise<BaseReportGenerator | null> {
    const template = getTemplateById(templateId)
    
    if (!template) {
      console.error(`Template not found: ${templateId}`)
      return null
    }
    
    // Special case for existing insurance report generator
    if (templateId === 'insurance-claim') {
      // Return a wrapper that adapts the existing generator
      return {
        async generateReport(data: any, options: any) {
          return reportGenerator.generateInsuranceReport(data)
        },
        getReportTitle() { return 'Insurance Claim Documentation' },
        getReportType() { return 'INSURANCE_CLAIM' }
      } as any
    }
    
    const GeneratorClass = generatorMap[template.generator]
    
    if (!GeneratorClass) {
      console.error(`Generator not found: ${template.generator}`)
      return null
    }
    
    return new GeneratorClass()
  }
  
  static async generateReport(
    templateId: string,
    projectId: string,
    dateRange: { start: Date; end: Date },
    options?: any
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const generator = await this.createGenerator(templateId)
      
      if (!generator) {
        return {
          success: false,
          error: `Generator not found for template: ${templateId}`
        }
      }
      
      // Fetch required data based on template requirements
      const template = getTemplateById(templateId)
      if (!template) {
        return {
          success: false,
          error: `Template not found: ${templateId}`
        }
      }
      
      // This is a simplified version - in production, you'd fetch data based on
      // template.dataRequirements
      const data = await this.fetchReportData(
        projectId,
        dateRange,
        template.dataRequirements
      )
      
      // Generate the report
      const reportBlob = await generator.generateReport(data, options)
      
      // Convert to base64 for easy transmission
      const buffer = await reportBlob.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      
      return {
        success: true,
        data: {
          blob: reportBlob,
          base64: base64,
          mimeType: 'application/pdf',
          fileName: `${templateId}-${Date.now()}.pdf`
        }
      }
    } catch (error) {
      console.error('Report generation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  private static async fetchReportData(
    projectId: string,
    dateRange: { start: Date; end: Date },
    requirements: string[]
  ): Promise<any> {
    // This would be implemented to fetch all required data
    // For now, returning a mock structure
    return {
      project: { /* project data */ },
      delays: [],
      weather: [],
      costs: {},
      company: {},
      // ... other required data
    }
  }
}