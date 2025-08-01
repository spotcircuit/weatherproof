import { n8nWebhooks } from './n8n-helpers'

export interface RealtimeWeatherData {
  temperature: number
  temperatureUnit: string
  wind_speed: number
  wind_direction: string
  precipitation_amount: number
  precipitation_type?: string
  conditions: string[]
  short_forecast: string
  has_alerts: boolean
  impacts: {
    concrete: boolean
    roofing: boolean
    crane: boolean
    electrical: boolean
    painting: boolean
  }
}

export async function fetchRealtimeWeather(
  latitude: number,
  longitude: number,
  projectId?: string
): Promise<RealtimeWeatherData | null> {
  try {
    const result = await n8nWebhooks.fetchProjectWeather({
      projectId: projectId || 'realtime-lookup',
      latitude,
      longitude,
      requestType: 'realtime',
      includeAlerts: true,
      includeHourly: false,
      storeResult: false // Don't store real-time lookups
    })

    if (result.success && result.data) {
      return {
        temperature: result.data.temperature,
        temperatureUnit: result.data.temperatureUnit,
        wind_speed: result.data.wind_speed,
        wind_direction: result.data.wind_direction,
        precipitation_amount: result.data.precipitation_amount,
        precipitation_type: result.data.precipitation_type,
        conditions: result.data.conditions,
        short_forecast: result.data.short_forecast,
        has_alerts: result.data.has_alerts,
        impacts: result.data.impacts
      }
    }

    console.error('Weather fetch failed:', result.error)
    return null
  } catch (error) {
    console.error('Error fetching realtime weather:', error)
    return null
  }
}

// Format weather data for display in delay documentation
export function formatWeatherForDisplay(weather: RealtimeWeatherData): string {
  const parts = []
  
  // Temperature
  parts.push(`${weather.temperature}°${weather.temperatureUnit}`)
  
  // Conditions
  if (weather.conditions.length > 0) {
    parts.push(weather.conditions.join(', '))
  }
  
  // Wind
  if (weather.wind_speed > 0) {
    parts.push(`Wind: ${weather.wind_speed} mph ${weather.wind_direction}`)
  }
  
  // Precipitation
  if (weather.precipitation_amount > 0) {
    parts.push(`${weather.precipitation_type || 'Precipitation'}: ${weather.precipitation_amount}"`)
  }
  
  // Alerts
  if (weather.has_alerts) {
    parts.push('⚠️ Weather Alert')
  }
  
  return parts.join(' • ')
}

// Check if weather conditions would impact specific work
export function getWeatherImpactSummary(weather: RealtimeWeatherData): string[] {
  const impacts = []
  
  if (weather.impacts.concrete) {
    impacts.push('Temperature too extreme for concrete work')
  }
  
  if (weather.impacts.roofing) {
    impacts.push('Conditions unsafe for roofing')
  }
  
  if (weather.impacts.crane) {
    impacts.push('Wind too high for crane operations')
  }
  
  if (weather.impacts.electrical) {
    impacts.push('Precipitation present - electrical work unsafe')
  }
  
  if (weather.impacts.painting) {
    impacts.push('Conditions not suitable for painting')
  }
  
  return impacts
}