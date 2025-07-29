// n8n Webhook Service for Weather Alerts and Notifications

interface WeatherAlertPayload {
  projectId: string
  projectName: string
  userEmail: string
  alertType: 'weather_delay' | 'threshold_exceeded' | 'severe_weather' | 'daily_report'
  data: {
    location: {
      address: string
      lat: number
      lng: number
    }
    weather: {
      temperature?: number
      windSpeed?: number
      precipitation?: number
      condition?: string
    }
    threshold?: {
      type: string
      value: number
      exceeded: number
    }
    delay?: {
      duration: number
      estimatedCost: number
      affectedActivities: string[]
    }
  }
  timestamp: string
}

interface WebhookResponse {
  success: boolean
  message: string
  notificationsSent?: {
    email?: boolean
    sms?: boolean
    push?: boolean
  }
}

export class WebhookService {
  private webhookUrl: string

  constructor() {
    // This will be set in .env.local
    this.webhookUrl = process.env.N8N_WEBHOOK_URL || ''
  }

  async sendWeatherAlert(payload: WeatherAlertPayload): Promise<WebhookResponse> {
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add auth header if n8n webhook requires it
          ...(process.env.N8N_WEBHOOK_AUTH && {
            'Authorization': `Bearer ${process.env.N8N_WEBHOOK_AUTH}`
          })
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.statusText}`)
      }

      const data = await response.json() as WebhookResponse
      return data
    } catch (error) {
      console.error('Failed to send webhook:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send alert'
      }
    }
  }

  // Helper methods for different alert types
  async sendDelayAlert(
    project: any,
    user: any,
    delayData: any
  ): Promise<WebhookResponse> {
    const payload: WeatherAlertPayload = {
      projectId: project.id,
      projectName: project.name,
      userEmail: user.email,
      alertType: 'weather_delay',
      data: {
        location: {
          address: project.address,
          lat: project.lat,
          lng: project.lng
        },
        weather: {
          temperature: delayData.temperature,
          windSpeed: delayData.windSpeed,
          precipitation: delayData.precipitation,
          condition: delayData.condition
        },
        delay: {
          duration: delayData.duration,
          estimatedCost: delayData.estimatedCost,
          affectedActivities: delayData.affectedActivities
        }
      },
      timestamp: new Date().toISOString()
    }

    return this.sendWeatherAlert(payload)
  }

  async sendThresholdAlert(
    project: any,
    user: any,
    thresholdData: any
  ): Promise<WebhookResponse> {
    const payload: WeatherAlertPayload = {
      projectId: project.id,
      projectName: project.name,
      userEmail: user.email,
      alertType: 'threshold_exceeded',
      data: {
        location: {
          address: project.address,
          lat: project.lat,
          lng: project.lng
        },
        weather: {
          temperature: thresholdData.currentWeather.temperature,
          windSpeed: thresholdData.currentWeather.windSpeed,
          precipitation: thresholdData.currentWeather.precipitation
        },
        threshold: {
          type: thresholdData.thresholdType,
          value: thresholdData.thresholdValue,
          exceeded: thresholdData.currentValue
        }
      },
      timestamp: new Date().toISOString()
    }

    return this.sendWeatherAlert(payload)
  }

  async sendDailyReport(
    project: any,
    user: any,
    reportData: any
  ): Promise<WebhookResponse> {
    const payload: WeatherAlertPayload = {
      projectId: project.id,
      projectName: project.name,
      userEmail: user.email,
      alertType: 'daily_report',
      data: {
        location: {
          address: project.address,
          lat: project.lat,
          lng: project.lng
        },
        weather: reportData.summary,
        delay: reportData.delays ? {
          duration: reportData.totalDelayHours,
          estimatedCost: reportData.totalCost,
          affectedActivities: reportData.affectedActivities
        } : undefined
      },
      timestamp: new Date().toISOString()
    }

    return this.sendWeatherAlert(payload)
  }
}

// Export singleton instance
export const webhookService = new WebhookService()