import { NextRequest, NextResponse } from 'next/server'
import { fetchRealtimeWeather, formatWeatherForDisplay, getWeatherImpactSummary } from '@/lib/weather-realtime'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, latitude, longitude } = body
    
    // Validate required fields
    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }
    
    // If projectId provided, verify it exists and update coordinates if needed
    let project = null
    if (projectId) {
      const { data } = await supabase
        .from('projects')
        .select('id, name, latitude, longitude')
        .eq('id', projectId)
        .single()
      
      project = data
    }
    
    // Fetch real-time weather data
    const weather = await fetchRealtimeWeather(
      latitude,
      longitude,
      projectId || 'realtime-request'
    )
    
    if (!weather) {
      return NextResponse.json(
        { error: 'Failed to fetch weather data' },
        { status: 500 }
      )
    }
    
    // Get impact summary
    const impacts = getWeatherImpactSummary(weather)
    
    // Format for display
    const formatted = formatWeatherForDisplay(weather)
    
    // Optionally store the real-time lookup for future reference
    if (projectId && body.store !== false) {
      try {
        await supabase
          .from('project_weather')
          .insert({
            project_id: projectId,
            collected_at: new Date().toISOString(),
            temperature: weather.temperature,
            temperature_unit: weather.temperatureUnit,
            wind_speed: weather.wind_speed,
            wind_direction: weather.wind_direction,
            precipitation_amount: weather.precipitation_amount,
            precipitation_type: weather.precipitation_type,
            conditions: weather.conditions,
            short_forecast: weather.short_forecast,
            has_alerts: weather.has_alerts,
            impacts_concrete: weather.impacts.concrete,
            impacts_roofing: weather.impacts.roofing,
            impacts_crane: weather.impacts.crane,
            impacts_electrical: weather.impacts.electrical,
            impacts_painting: weather.impacts.painting,
            data_source: 'realtime',
            created_by: body.userId || null
          })
      } catch (error) {
        console.error('Failed to store weather data:', error)
        // Don't fail the request if storage fails
      }
    }
    
    return NextResponse.json({
      success: true,
      weather,
      formatted,
      impacts,
      project: project ? {
        id: project.id,
        name: project.name
      } : null,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Realtime weather API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// GET endpoint for documentation
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/weather/realtime',
    method: 'POST',
    description: 'Fetch real-time weather data for a location',
    body: {
      latitude: 'number (required)',
      longitude: 'number (required)',
      projectId: 'string (optional)',
      userId: 'string (optional)',
      store: 'boolean (optional, default: true)'
    },
    response: {
      success: 'boolean',
      weather: 'RealtimeWeatherData object',
      formatted: 'string - Human readable weather summary',
      impacts: 'string[] - Work impact warnings',
      project: 'object - Project info if projectId provided',
      timestamp: 'string - ISO timestamp'
    }
  })
}