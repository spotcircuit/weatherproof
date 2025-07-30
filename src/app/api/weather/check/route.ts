import { NextRequest, NextResponse } from 'next/server'
import { createServerClientNext } from '@/lib/supabase-server'
import { noaaWeatherService } from '@/services/weather/noaa'

// This endpoint is called by n8n to check weather for projects
// n8n will handle the scheduling (every 15 minutes, etc.)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // n8n can send either a single project or array of projects
    const { projectId, projectIds, checkAll } = body
    
    const supabase = await createServerClientNext()
    let projects = []
    
    // Determine which projects to check
    if (checkAll) {
      // Check all active projects
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('active', true)
      
      if (error) throw error
      projects = data || []
      
    } else if (projectIds && Array.isArray(projectIds)) {
      // Check specific projects
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .in('id', projectIds)
        .eq('active', true)
      
      if (error) throw error
      projects = data || []
      
    } else if (projectId) {
      // Check single project
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()
      
      if (error) throw error
      if (data) projects = [data]
    }
    
    if (projects.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No projects to check',
        results: []
      })
    }
    
    // Check weather for each project
    const results = []
    
    for (const project of projects) {
      try {
        // Get current weather
        const weather = await noaaWeatherService.getCurrentWeather(
          project.latitude,
          project.longitude
        )
        
        // Store weather reading
        await supabase
          .from('weather_readings')
          .insert({
            project_id: project.id,
            timestamp: weather.timestamp,
            temperature: weather.temperature,
            wind_speed: weather.wind_speed,
            precipitation: weather.precipitation,
            humidity: weather.humidity,
            pressure: weather.pressure,
            visibility: weather.visibility,
            conditions: weather.conditions,
            source: weather.source,
            station_id: weather.station.id,
            station_distance: weather.station.distance,
            raw_data: weather.raw_data
          })
        
        // Check thresholds
        const violations = noaaWeatherService.checkThresholds(
          weather,
          project.weather_thresholds
        )
        
        // Prepare result data for n8n
        const result: any = {
          projectId: project.id,
          projectName: project.name,
          projectAddress: project.address,
          timestamp: new Date().toISOString(),
          weather: {
            temperature: weather.temperature,
            windSpeed: weather.wind_speed,
            precipitation: weather.precipitation,
            humidity: weather.humidity,
            visibility: weather.visibility,
            conditions: weather.conditions,
            station: {
              id: weather.station.id,
              name: weather.station.name,
              distance: weather.station.distance
            }
          },
          thresholds: project.weather_thresholds,
          violations: violations,
          delayDetected: violations.length > 0,
          delayReasons: violations.map(v => ({
            type: v.type,
            value: v.value,
            threshold: v.threshold,
            unit: v.unit,
            exceeded: v.value > v.threshold
          }))
        }
        
        // If delay detected, add cost calculations
        if (violations.length > 0) {
          const hoursInDay = 8
          const laborCost = project.crew_size * project.hourly_rate * hoursInDay
          const overheadCost = project.daily_overhead || 500
          const totalCost = laborCost + overheadCost
          
          result.delayCosts = {
            hoursLost: hoursInDay,
            crewSize: project.crew_size,
            hourlyRate: project.hourly_rate,
            laborCost: laborCost,
            overheadCost: overheadCost,
            totalCost: totalCost
          }
          
          // Check if this is a new delay or continuing
          const { data: activeDelay } = await supabase
            .from('delay_events')
            .select('id, start_time')
            .eq('project_id', project.id)
            .is('end_time', null)
            .single()
          
          if (activeDelay) {
            result.delayStatus = 'continuing'
            result.delayStarted = activeDelay.start_time
            result.delayId = activeDelay.id
          } else {
            result.delayStatus = 'new'
            
            // Create delay event
            const { data: newDelay } = await supabase
              .from('delay_events')
              .insert({
                project_id: project.id,
                start_time: new Date().toISOString(),
                weather_condition: violations.map(v => v.type).join(', '),
                threshold_violated: violations,
                affected_activities: getAffectedActivities(project.project_type || 'general', violations),
                estimated_cost: totalCost,
                labor_hours_lost: hoursInDay,
                crew_size: project.crew_size,
                labor_cost: laborCost,
                equipment_cost: 0,
                overhead_cost: overheadCost,
                total_cost: totalCost,
                auto_generated: true
              })
              .select('id')
              .single()
            
            if (newDelay) {
              result.delayId = newDelay.id
            }
          }
        } else {
          // Check if a delay just ended
          const { data: activeDelay } = await supabase
            .from('delay_events')
            .select('*')
            .eq('project_id', project.id)
            .is('end_time', null)
            .single()
          
          if (activeDelay) {
            // End the delay
            const endTime = new Date()
            const startTime = new Date(activeDelay.start_time)
            const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
            
            await supabase
              .from('delay_events')
              .update({
                end_time: endTime.toISOString(),
                duration_hours: durationHours
              })
              .eq('id', activeDelay.id)
            
            result.delayEnded = true
            result.delayDuration = durationHours
            result.delayEndedId = activeDelay.id
          }
        }
        
        // Get user info for notifications
        const { data: user } = await supabase
          .from('users')
          .select('email, name, company, notification_preferences')
          .eq('id', project.user_id)
          .single()
        
        if (user) {
          result.user = {
            email: user.email,
            name: user.name,
            company: user.company,
            notifications: user.notification_preferences
          }
        }
        
        results.push(result)
        
      } catch (error) {
        console.error(`Error checking project ${project.id}:`, error)
        results.push({
          projectId: project.id,
          projectName: project.name,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })
      }
    }
    
    // Return results for n8n to process
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      projectsChecked: projects.length,
      delaysDetected: results.filter(r => r.delayDetected).length,
      results: results
    })
    
  } catch (error) {
    console.error('Weather check API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Helper function to determine affected activities
function getAffectedActivities(projectType: string, violations: any[]): string[] {
  const activities: { [key: string]: { [key: string]: string[] } } = {
    roofing: {
      wind_speed: ['shingle installation', 'underlayment', 'flashing work'],
      precipitation: ['all roofing work', 'material handling'],
      temperature_low: ['shingle installation', 'adhesive application'],
      temperature_high: ['worker safety', 'material handling']
    },
    concrete: {
      temperature_low: ['concrete pouring', 'finishing work', 'curing'],
      temperature_high: ['concrete pouring', 'curing quality'],
      precipitation: ['concrete finishing', 'formwork'],
      wind_speed: ['concrete pumping', 'finishing']
    },
    framing: {
      wind_speed: ['crane operations', 'tall wall erection', 'roof framing'],
      precipitation: ['material protection', 'worker safety'],
      temperature_low: ['nail gun operation', 'worker efficiency']
    },
    painting: {
      precipitation: ['all painting work'],
      humidity: ['paint application', 'drying time'],
      temperature_low: ['paint application', 'adhesion'],
      temperature_high: ['paint quality', 'worker safety'],
      wind_speed: ['spray painting', 'overspray control']
    },
    general: {
      wind_speed: ['crane operations', 'elevated work'],
      precipitation: ['outdoor work', 'material handling'],
      temperature_low: ['worker safety', 'equipment operation'],
      temperature_high: ['worker safety', 'productivity']
    }
  }

  const affected = new Set<string>()
  const projectActivities = activities[projectType] || activities.general

  violations.forEach(violation => {
    const violationType = violation.type
    if (projectActivities[violationType]) {
      projectActivities[violationType].forEach(activity => affected.add(activity))
    }
  })

  return Array.from(affected)
}