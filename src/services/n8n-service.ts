interface N8nRequest {
  workflow: 'parse-delay' | 'generate-report' | 'analyze-photos' | 'check-weather'
  data: any
}

interface N8nResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

class N8nService {
  private baseUrl: string
  private authToken?: string

  constructor() {
    this.baseUrl = process.env.N8N_WEBHOOK_URL || ''
    this.authToken = process.env.N8N_WEBHOOK_AUTH
  }

  private async callWebhook<T>(request: N8nRequest): Promise<N8nResponse<T>> {
    if (!this.baseUrl) {
      throw new Error('N8N_WEBHOOK_URL not configured')
    }

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`N8n webhook failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('N8n webhook error:', error)
      throw error
    }
  }

  // Parse delay description using n8n AI workflow
  async parseDelayDescription(description: string, date?: Date) {
    return this.callWebhook({
      workflow: 'parse-delay',
      data: {
        description,
        date: date?.toISOString(),
        timestamp: new Date().toISOString()
      }
    })
  }

  // Generate report using n8n workflow
  async generateReport(reportId: string, format: 'pdf' | 'docx' | 'acord') {
    return this.callWebhook({
      workflow: 'generate-report',
      data: {
        reportId,
        format,
        includePhotos: true
      }
    })
  }

  // Analyze photos for damage documentation
  async analyzePhotos(photos: string[]) {
    return this.callWebhook({
      workflow: 'analyze-photos',
      data: {
        photos,
        analysisType: 'weather-damage'
      }
    })
  }

  // Check weather alerts
  async checkWeatherAlerts(projectIds: string[]) {
    return this.callWebhook({
      workflow: 'check-weather',
      data: {
        projectIds,
        hoursAhead: 24
      }
    })
  }
}

export const n8nService = new N8nService()