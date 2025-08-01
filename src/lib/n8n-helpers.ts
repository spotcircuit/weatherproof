// Helper functions for n8n integration

interface N8nWebhookResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  fallbackToLocal?: boolean
}

interface N8nWebhookOptions {
  url: string
  auth?: string
  timeout?: number
  fallbackOnError?: boolean
}

export async function callN8nWebhook<TInput, TOutput>(
  input: TInput,
  options: N8nWebhookOptions
): Promise<N8nWebhookResponse<TOutput>> {
  const { url, auth, timeout = 30000, fallbackOnError = true } = options

  if (!url) {
    return {
      success: false,
      error: 'No webhook URL configured',
      fallbackToLocal: true
    }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (auth) {
      headers['Authorization'] = auth
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Webhook returned ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    
    // Handle n8n response format
    if (result.success === false) {
      throw new Error(result.error || 'Webhook failed')
    }

    return {
      success: true,
      data: result.data || result
    }
  } catch (error: any) {
    console.error('n8n webhook error:', error)
    
    return {
      success: false,
      error: error.message,
      fallbackToLocal: fallbackOnError
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

// Specific webhook callers
export const n8nWebhooks = {
  async parseDelay(description: string, date?: Date) {
    return callN8nWebhook<
      { description: string; date?: string },
      import('@/services/n8n-delay-parser').ParsedDelayInfo
    >(
      {
        description,
        date: date?.toISOString()
      },
      {
        url: process.env.N8N_PARSE_DELAY_URL!,
        auth: process.env.N8N_WEBHOOK_AUTH,
        timeout: 15000
      }
    )
  },

  async generateReport(reportId: string, format: 'pdf' | 'docx' | 'acord') {
    return callN8nWebhook(
      {
        reportId,
        format,
        includePhotos: true,
        templateType: 'insurance_claim'
      },
      {
        url: process.env.N8N_GENERATE_REPORT_URL!,
        auth: process.env.N8N_WEBHOOK_AUTH,
        timeout: 60000 // Reports take longer
      }
    )
  },

  async analyzePhotos(photoUrls: string[]) {
    return callN8nWebhook(
      {
        photos: photoUrls,
        analysisType: 'weather-damage',
        includeOCR: true,
        extractTimestamps: true
      },
      {
        url: process.env.N8N_ANALYZE_PHOTOS_URL!,
        auth: process.env.N8N_WEBHOOK_AUTH,
        timeout: 30000
      }
    )
  },

  async checkWeatherAlerts(projectIds: string[]) {
    return callN8nWebhook(
      {
        projectIds,
        hoursAhead: 24,
        severityThreshold: 'moderate',
        includeRadar: true
      },
      {
        url: process.env.N8N_WEATHER_CHECK_URL!,
        auth: process.env.N8N_WEBHOOK_AUTH,
        timeout: 20000
      }
    )
  },

  async fetchNOAAWeather(params: {
    latitude: number
    longitude: number
    date: string
    startTime?: string
    endTime?: string
    gridId?: string
    gridX?: number
    gridY?: number
  }) {
    return callN8nWebhook<
      typeof params,
      {
        temperature: number
        temperatureUnit: string
        windSpeed: number
        windDirection: string
        precipitation: number
        precipitationType?: string
        conditions: string[]
        humidity?: number
        pressure?: number
        visibility?: number
        cloudCover?: number
        alerts?: Array<{
          event: string
          severity: string
          urgency: string
          description: string
        }>
        raw?: any
      }
    >(
      params,
      {
        url: process.env.N8N_NOAA_WEATHER_URL!,
        auth: process.env.N8N_WEBHOOK_AUTH,
        timeout: 15000
      }
    )
  },

  async fetchProjectWeather(params: {
    projectId: string
    latitude: number
    longitude: number
    gridId?: string
    gridX?: number
    gridY?: number
    requestType: 'scheduled' | 'realtime'
    userId?: string
    includeAlerts?: boolean
    includeHourly?: boolean
    storeResult?: boolean
  }) {
    return callN8nWebhook<
      typeof params,
      {
        temperature: number
        temperatureUnit: string
        feels_like?: number
        temperature_min?: number
        temperature_max?: number
        wind_speed: number
        wind_gust?: number
        wind_direction: string
        precipitation_probability: number
        precipitation_amount: number
        precipitation_type?: string
        humidity?: number
        visibility?: number
        cloud_cover?: number
        uv_index?: number
        short_forecast: string
        detailed_forecast?: string
        conditions: string[]
        impacts: {
          concrete: boolean
          roofing: boolean
          crane: boolean
          electrical: boolean
          painting: boolean
        }
        has_alerts: boolean
        alert_count: number
        alerts?: Array<{
          id: string
          event: string
          severity: string
          urgency: string
          certainty: string
          headline: string
          description: string
          onset: string
          expires: string
        }>
        grid?: {
          gridId: string
          gridX: number
          gridY: number
        }
        raw_data?: any
      }
    >(
      params,
      {
        url: process.env.N8N_PROJECT_WEATHER_URL || process.env.N8N_NOAA_WEATHER_URL!,
        auth: process.env.N8N_WEBHOOK_AUTH,
        timeout: params.requestType === 'realtime' ? 10000 : 30000
      }
    )
  }
}

// Log webhook performance
export async function logWebhookPerformance(
  webhookName: string,
  duration: number,
  success: boolean,
  error?: string
) {
  // Could send to analytics or store in database
  console.log(`n8n webhook ${webhookName}:`, {
    duration: `${duration}ms`,
    success,
    error
  })
}

// Test webhook connection
export async function testN8nConnection(webhookUrl: string): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.N8N_WEBHOOK_AUTH && {
          'Authorization': process.env.N8N_WEBHOOK_AUTH
        })
      },
      body: JSON.stringify({ test: true })
    })

    return response.ok
  } catch {
    return false
  }
}