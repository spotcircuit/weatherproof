import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { n8nWebhooks } from '@/lib/n8n-helpers'

// Initialize Supabase client with service role for scheduled tasks
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Verify this is an authorized request (e.g., from a cron job)
    const authHeader = request.headers.get('authorization')
    const expectedAuth = process.env.CRON_AUTH_TOKEN || process.env.N8N_WEBHOOK_AUTH
    
    if (authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all active projects that have weather collection enabled
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, address, latitude, longitude, weather_collection_enabled, weather_collection_frequency, weather_last_collected_at')
      .eq('active', true)
      .eq('weather_collection_enabled', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)

    if (projectsError) {
      console.error('Error fetching projects:', projectsError)
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      )
    }

    if (!projects || projects.length === 0) {
      return NextResponse.json({
        message: 'No active projects with weather collection enabled',
        processed: 0
      })
    }

    const results = []
    const errors = []

    // Process each project
    for (const project of projects) {
      try {
        // Check if enough time has passed since last collection
        const frequency = project.weather_collection_frequency || 30 // default 30 minutes
        const lastCollected = project.weather_last_collected_at 
          ? new Date(project.weather_last_collected_at) 
          : new Date(0)
        const now = new Date()
        const minutesSinceLastCollection = (now.getTime() - lastCollected.getTime()) / (1000 * 60)
        
        if (minutesSinceLastCollection < frequency) {
          results.push({
            projectId: project.id,
            status: 'skipped',
            reason: `Only ${minutesSinceLastCollection.toFixed(0)} minutes since last collection (frequency: ${frequency})`
          })
          continue
        }

        // Fetch weather data from n8n webhook
        const weatherResult = await n8nWebhooks.fetchProjectWeather({
          projectId: project.id,
          latitude: project.latitude,
          longitude: project.longitude,
          requestType: 'scheduled',
          includeAlerts: true,
          includeHourly: false,
          storeResult: true // Tell n8n to store in database
        })

        if (weatherResult.success && weatherResult.data) {
          // Store weather data in database
          const { error: insertError } = await supabase
            .from('project_weather')
            .insert({
              project_id: project.id,
              collected_at: now.toISOString(),
              temperature: weatherResult.data.temperature,
              temperature_unit: weatherResult.data.temperatureUnit,
              feels_like: weatherResult.data.feels_like,
              wind_speed: weatherResult.data.wind_speed,
              wind_gust: weatherResult.data.wind_gust,
              wind_direction: weatherResult.data.wind_direction,
              precipitation_probability: weatherResult.data.precipitation_probability,
              precipitation_amount: weatherResult.data.precipitation_amount,
              precipitation_type: weatherResult.data.precipitation_type,
              humidity: weatherResult.data.humidity,
              visibility: weatherResult.data.visibility,
              cloud_cover: weatherResult.data.cloud_cover,
              uv_index: weatherResult.data.uv_index,
              short_forecast: weatherResult.data.short_forecast,
              detailed_forecast: weatherResult.data.detailed_forecast,
              conditions: weatherResult.data.conditions,
              impacts_concrete: weatherResult.data.impacts?.concrete || false,
              impacts_roofing: weatherResult.data.impacts?.roofing || false,
              impacts_crane: weatherResult.data.impacts?.crane || false,
              impacts_electrical: weatherResult.data.impacts?.electrical || false,
              impacts_painting: weatherResult.data.impacts?.painting || false,
              has_alerts: weatherResult.data.has_alerts,
              alert_count: weatherResult.data.alert_count,
              highest_alert_severity: weatherResult.data.alerts?.[0]?.severity,
              data_source: 'forecast',
              grid_id: weatherResult.data.grid?.gridId,
              grid_x: weatherResult.data.grid?.gridX,
              grid_y: weatherResult.data.grid?.gridY,
              raw_data: weatherResult.data.raw_data || weatherResult.data
            })

          if (insertError) {
            throw insertError
          }

          // Store alerts separately if any
          if (weatherResult.data.alerts && weatherResult.data.alerts.length > 0) {
            const alertsToInsert = weatherResult.data.alerts.map(alert => ({
              project_id: project.id,
              weather_id: null, // Will be linked after weather insert
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

            const { error: alertsError } = await supabase
              .from('project_weather_alerts')
              .insert(alertsToInsert)

            if (alertsError) {
              console.error('Error inserting alerts:', alertsError)
            }
          }

          // Update project's last collected timestamp
          await supabase
            .from('projects')
            .update({ weather_last_collected_at: now.toISOString() })
            .eq('id', project.id)

          results.push({
            projectId: project.id,
            projectName: project.name,
            status: 'success',
            temperature: weatherResult.data.temperature,
            conditions: weatherResult.data.conditions,
            hasAlerts: weatherResult.data.has_alerts
          })
        } else {
          throw new Error(weatherResult.error || 'Failed to fetch weather data')
        }
      } catch (error: any) {
        console.error(`Error processing project ${project.id}:`, error)
        errors.push({
          projectId: project.id,
          projectName: project.name,
          error: error.message
        })
      }
    }

    return NextResponse.json({
      message: 'Weather collection completed',
      processed: projects.length,
      successful: results.filter(r => r.status === 'success').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      failed: errors.length,
      results,
      errors
    })
  } catch (error: any) {
    console.error('Weather collection error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// GET endpoint for testing/monitoring
export async function GET() {
  return NextResponse.json({
    message: 'Weather collection endpoint',
    method: 'POST',
    headers: {
      'Authorization': 'Your CRON_AUTH_TOKEN or N8N_WEBHOOK_AUTH',
      'Content-Type': 'application/json'
    },
    description: 'Collects weather data for all active projects with weather collection enabled'
  })
}