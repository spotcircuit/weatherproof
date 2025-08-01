import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')
    const hoursAgo = parseInt(searchParams.get('hoursAgo') || '24')
    
    // Calculate the time range
    const since = new Date()
    since.setHours(since.getHours() - hoursAgo)
    
    // Fetch weather data for the project
    const { data: weather, error } = await supabase
      .from('project_weather')
      .select(`
        *,
        project:projects(name, address)
      `)
      .eq('project_id', projectId)
      .gte('collected_at', since.toISOString())
      .order('collected_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('Error fetching weather data:', error)
      return NextResponse.json(
        { error: 'Failed to fetch weather data' },
        { status: 500 }
      )
    }
    
    // Get the latest weather entry
    const latest = weather?.[0] || null
    
    // Check for any active alerts
    let alerts = []
    if (latest) {
      const { data: weatherAlerts } = await supabase
        .from('project_weather_alerts')
        .select('*')
        .eq('project_id', projectId)
        .gte('expires', new Date().toISOString())
        .order('severity', { ascending: false })
      
      alerts = weatherAlerts || []
    }
    
    return NextResponse.json({
      projectId,
      latest,
      history: weather || [],
      alerts,
      summary: latest ? {
        temperature: `${latest.temperature}°${latest.temperature_unit}`,
        conditions: latest.conditions?.join(', ') || 'Clear',
        wind: `${latest.wind_speed} mph ${latest.wind_direction}`,
        hasAlerts: latest.has_alerts,
        lastUpdated: latest.collected_at,
        impacts: {
          concrete: latest.impacts_concrete,
          roofing: latest.impacts_roofing,
          crane: latest.impacts_crane,
          electrical: latest.impacts_electrical,
          painting: latest.impacts_painting
        }
      } : null
    })
  } catch (error: any) {
    console.error('Weather project API error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}