import { createClient } from '@/lib/supabase'
import { n8nWebhooks } from '@/lib/n8n-helpers'

export interface WeatherData {
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

export interface StoredWeatherData {
  id: string
  project_id: string
  collected_at: string
  temperature: number
  wind_speed: number
  precipitation_amount: number
  conditions: string[]
  short_forecast: string
  has_alerts: boolean
  data_source: 'forecast' | 'observation' | 'realtime' | 'manual'
  created_at: string
}

/**
 * Fetch real-time weather data from NOAA via n8n webhook
 */
export async function fetchRealtimeWeather(
  projectId: string,
  latitude: number,
  longitude: number,
  gridData?: { gridId: string; gridX: number; gridY: number }
): Promise<WeatherData | null> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const result = await n8nWebhooks.fetchProjectWeather({
      projectId,
      latitude,
      longitude,
      gridId: gridData?.gridId,
      gridX: gridData?.gridX,
      gridY: gridData?.gridY,
      requestType: 'realtime',
      userId: user?.id,
      includeAlerts: true,
      includeHourly: true,
      storeResult: false // We'll store it ourselves
    })

    if (result.success && result.data) {
      return result.data
    }

    return null
  } catch (error) {
    console.error('Failed to fetch realtime weather:', error)
    return null
  }
}

/**
 * Store weather data in the database
 */
export async function storeWeatherData(
  projectId: string,
  weather: WeatherData,
  source: 'realtime' | 'scheduled' = 'realtime'
): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('project_weather')
      .insert({
        project_id: projectId,
        collected_at: new Date().toISOString(),
        
        // Temperature data
        temperature: weather.temperature,
        temperature_unit: weather.temperatureUnit || 'F',
        feels_like: weather.feels_like,
        temperature_min: weather.temperature_min,
        temperature_max: weather.temperature_max,
        
        // Wind data
        wind_speed: weather.wind_speed,
        wind_gust: weather.wind_gust,
        wind_direction: weather.wind_direction,
        
        // Precipitation
        precipitation_probability: weather.precipitation_probability,
        precipitation_amount: weather.precipitation_amount,
        precipitation_type: weather.precipitation_type,
        
        // Other conditions
        humidity: weather.humidity,
        visibility: weather.visibility,
        cloud_cover: weather.cloud_cover,
        uv_index: weather.uv_index,
        
        // Forecasts
        short_forecast: weather.short_forecast,
        detailed_forecast: weather.detailed_forecast,
        conditions: weather.conditions,
        
        // Impacts (will be calculated by trigger)
        impacts_concrete: weather.impacts?.concrete,
        impacts_roofing: weather.impacts?.roofing,
        impacts_crane: weather.impacts?.crane,
        impacts_electrical: weather.impacts?.electrical,
        impacts_painting: weather.impacts?.painting,
        
        // Alerts
        has_alerts: weather.has_alerts,
        alert_count: weather.alert_count,
        highest_alert_severity: weather.alerts?.[0]?.severity,
        
        // Source
        data_source: source,
        grid_id: weather.grid?.gridId,
        grid_x: weather.grid?.gridX,
        grid_y: weather.grid?.gridY,
        raw_data: weather.raw_data,
        created_by: source === 'realtime' ? user?.id : null
      })

    if (error) {
      console.error('Failed to store weather data:', error)
      return false
    }

    // Store alerts separately if any
    if (weather.alerts && weather.alerts.length > 0) {
      await storeWeatherAlerts(projectId, weather.alerts)
    }

    // Update project's last collected timestamp
    await supabase
      .from('projects')
      .update({ weather_last_collected_at: new Date().toISOString() })
      .eq('id', projectId)

    return true
  } catch (error) {
    console.error('Failed to store weather data:', error)
    return false
  }
}

/**
 * Store weather alerts
 */
async function storeWeatherAlerts(
  projectId: string,
  alerts: WeatherData['alerts']
): Promise<void> {
  if (!alerts || alerts.length === 0) return

  const supabase = createClient()
  
  // Get the latest weather record
  const { data: weatherRecord } = await supabase
    .from('project_weather')
    .select('id')
    .eq('project_id', projectId)
    .order('collected_at', { ascending: false })
    .limit(1)
    .single()

  if (!weatherRecord) return

  const alertsToInsert = alerts.map(alert => ({
    weather_id: weatherRecord.id,
    project_id: projectId,
    alert_id: alert.id,
    event_type: alert.event,
    severity: alert.severity,
    urgency: alert.urgency,
    certainty: alert.certainty,
    headline: alert.headline,
    description: alert.description,
    onset: alert.onset,
    expires: alert.expires,
    raw_alert: alert
  }))

  await supabase
    .from('project_weather_alerts')
    .upsert(alertsToInsert, { onConflict: 'alert_id' })
}

/**
 * Get stored weather data for a specific time range
 */
export async function getStoredWeather(
  projectId: string,
  startTime: Date,
  endTime?: Date
): Promise<StoredWeatherData[]> {
  const supabase = createClient()
  
  let query = supabase
    .from('project_weather')
    .select('*')
    .eq('project_id', projectId)
    .gte('collected_at', startTime.toISOString())
    
  if (endTime) {
    query = query.lte('collected_at', endTime.toISOString())
  }
  
  const { data, error } = await query
    .order('collected_at', { ascending: false })
    .limit(48) // Max 48 hours of data

  if (error) {
    console.error('Failed to fetch stored weather:', error)
    return []
  }

  return data || []
}

/**
 * Get the most recent weather data for a project
 */
export async function getLatestWeather(
  projectId: string
): Promise<StoredWeatherData | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('project_weather')
    .select('*')
    .eq('project_id', projectId)
    .order('collected_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error('Failed to fetch latest weather:', error)
    return null
  }

  return data
}

/**
 * Check if weather data is stale and needs refresh
 */
export function isWeatherStale(
  weather: StoredWeatherData | null,
  maxAgeMinutes: number = 60
): boolean {
  if (!weather) return true
  
  const collectedAt = new Date(weather.collected_at)
  const ageInMinutes = (Date.now() - collectedAt.getTime()) / 1000 / 60
  
  return ageInMinutes > maxAgeMinutes
}

/**
 * Get weather data age in minutes
 */
export function getWeatherAge(weather: StoredWeatherData | null): number {
  if (!weather) return Infinity
  
  const collectedAt = new Date(weather.collected_at)
  return Math.floor((Date.now() - collectedAt.getTime()) / 1000 / 60)
}