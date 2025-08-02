// Weather monitoring service that checks projects and detects delays

import { createServerClientNext } from '@/lib/supabase-server'
import { noaaWeatherService } from './weather/noaa'
import { webhookService } from './webhook'

interface Project {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  weather_thresholds: any
  user_id: string
  crew_size: number
  hourly_rate: number
  daily_overhead: number
}

interface WeatherReading {
  temperature: number | null
  wind_speed: number | null
  precipitation: number | null
  humidity: number | null
  visibility: number | null
  conditions: string
}

export class WeatherMonitorService {
  
  // Check all active projects for weather delays
  async monitorActiveProjects() {
    const supabase = await createServerClientNext()
    
    try {
      // Get all active projects
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .eq('active', true)
      
      if (error) throw error
      if (!projects || projects.length === 0) {
        console.log('No active projects to monitor')
        return
      }

      console.log(`Monitoring weather for ${projects.length} active projects`)
      
      // Check each project
      for (const project of projects) {
        await this.checkProjectWeather(project)
      }
      
    } catch (error) {
      console.error('Error monitoring projects:', error)
      throw error
    }
  }

  // Check weather for a single project
  async checkProjectWeather(project: Project) {
    const supabase = await createServerClientNext()
    
    try {
      // Get current weather from NOAA
      const weather = await noaaWeatherService.getCurrentWeather(
        project.latitude,
        project.longitude
      )
      
      // Store weather reading
      const { error: weatherError } = await supabase
        .from('project_weather')
        .insert({
          project_id: project.id,
          collected_at: weather.timestamp,
          temperature: weather.temperature,
          wind_speed: weather.wind_speed,
          precipitation_amount: weather.precipitation,
          humidity: weather.humidity,
          pressure: weather.pressure,
          visibility: weather.visibility,
          conditions: weather.conditions,
          data_source: weather.source,
          station_id: weather.station.id,
          station_distance: weather.station.distance,
          raw_data: weather.raw_data
        })
      
      if (weatherError) {
        console.error('Error storing weather reading:', weatherError)
      }

      // Check for threshold violations
      const violations = noaaWeatherService.checkThresholds(
        weather,
        project.weather_thresholds
      )
      
      if (violations.length > 0) {
        await this.handleWeatherDelay(project, weather, violations)
      }
      
      // Check if existing delay has ended
      await this.checkDelayEnded(project, weather)
      
    } catch (error) {
      console.error(`Error checking weather for project ${project.id}:`, error)
    }
  }

  // Handle detected weather delay
  async handleWeatherDelay(project: Project, weather: any, violations: any[]) {
    const supabase = await createServerClientNext()
    
    try {
      // Check if there's already an active delay
      const { data: activeDelay } = await supabase
        .from('task_daily_logs')
        .select(`
          *,
          project_tasks!inner(project_id)
        `)
        .eq('project_tasks.project_id', project.id)
        .eq('delayed', true)
        .is('delay_end_time', null)
        .order('log_date', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (activeDelay) {
        // Update existing delay
        console.log(`Continuing delay for project ${project.name}`)
        return
      }

      // Calculate costs (assuming full day delay for now)
      const hoursInDay = 8
      const laborCost = project.crew_size * project.hourly_rate * hoursInDay
      const overheadCost = project.daily_overhead
      const totalCost = laborCost + overheadCost

      // Find or create a task for today's delay logging
      const today = new Date().toISOString().split('T')[0]
      let { data: tasks } = await supabase
        .from('project_tasks')
        .select('id')
        .eq('project_id', project.id)
        .limit(1)
      
      if (!tasks || tasks.length === 0) {
        // Create a default task if none exists
        const { data: newTask } = await supabase
          .from('project_tasks')
          .insert({
            project_id: project.id,
            name: 'Weather Monitoring',
            description: 'Auto-generated task for weather delay logging',
            status: 'in_progress'
          })
          .select('id')
          .single()
        tasks = newTask ? [newTask] : []
      }
      
      if (!tasks || tasks.length === 0) {
        throw new Error('Could not create or find task for delay logging')
      }

      // Create new delay log entry
      const { data: delayEvent, error } = await supabase
        .from('task_daily_logs')
        .insert({
          task_id: tasks[0].id,
          log_date: today,
          delayed: true,
          delay_reason: violations.map(v => v.type).join(', '),
          delay_category: 'weather',
          weather_snapshot: {
            conditions: violations.map(v => v.type).join(', '),
            threshold_violated: violations,
            affected_activities: this.getAffectedActivities((project as any).project_type || 'general', violations),
            temperature: weather.temperature,
            wind_speed: weather.wind_speed,
            precipitation: weather.precipitation
          },
          hours_worked: Math.max(0, hoursInDay - hoursInDay), // 0 hours worked during delay
          estimated_cost: totalCost,
          notes: `Auto-generated weather delay: ${violations.map(v => v.type).join(', ')}`,
          delay_start_time: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error

      // Create alert
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', project.user_id)
        .single()

      const alertMessage = `Weather delay detected at ${project.name}. ${violations.map(v => 
        `${v.type}: ${v.value}${v.unit} (threshold: ${v.threshold}${v.unit})`
      ).join(', ')}`

      const { data: alert } = await supabase
        .from('alerts')
        .insert({
          project_id: project.id,
          user_id: project.user_id,
          type: 'WEATHER_WARNING',
          severity: this.calculateSeverity(violations),
          message: alertMessage,
          weather_data: { weather, violations }
        })
        .select()
        .single()

      // Send webhook notification
      if (user) {
        await webhookService.sendDelayAlert(
          project,
          user,
          {
            temperature: weather.temperature,
            windSpeed: weather.wind_speed,
            precipitation: weather.precipitation,
            condition: weather.conditions,
            duration: hoursInDay,
            estimatedCost: totalCost,
            affectedActivities: this.getAffectedActivities((project as any).project_type || 'general', violations)
          }
        )
      }

      console.log(`Weather delay created for project ${project.name}`)
      
    } catch (error) {
      console.error('Error handling weather delay:', error)
    }
  }

  // Check if a delay has ended
  async checkDelayEnded(project: Project, weather: any) {
    const supabase = await createServerClientNext()
    
    try {
      // Get active delay
      const { data: activeDelay } = await supabase
        .from('task_daily_logs')
        .select(`
          *,
          project_tasks!inner(project_id)
        `)
        .eq('project_tasks.project_id', project.id)
        .eq('delayed', true)
        .is('delay_end_time', null)
        .order('log_date', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (!activeDelay) return

      // Check if weather is now within thresholds
      const violations = noaaWeatherService.checkThresholds(
        weather,
        project.weather_thresholds
      )
      
      if (violations.length === 0) {
        // End the delay
        const endTime = new Date()
        const startTime = new Date(activeDelay.delay_start_time)
        const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
        
        // Update costs based on actual duration
        const laborCost = project.crew_size * project.hourly_rate * durationHours
        const overheadCost = (durationHours / 8) * project.daily_overhead
        const totalCost = laborCost + overheadCost

        await supabase
          .from('task_daily_logs')
          .update({
            delay_end_time: endTime.toISOString(),
            delay_duration_hours: durationHours,
            estimated_cost: totalCost,
            notes: (activeDelay.notes || '') + `\nDelay ended at ${endTime.toISOString()}. Duration: ${durationHours.toFixed(1)} hours.`
          })
          .eq('id', activeDelay.id)

        // Create alert
        await supabase
          .from('alerts')
          .insert({
            project_id: project.id,
            user_id: project.user_id,
            type: 'DELAY_ENDED',
            severity: 'LOW',
            message: `Weather delay ended at ${project.name}. Duration: ${durationHours.toFixed(1)} hours, Cost: $${totalCost.toFixed(2)}`,
            weather_data: { weather, duration: durationHours, cost: totalCost }
          })

        console.log(`Weather delay ended for project ${project.name}`)
      }
    } catch (error) {
      console.error('Error checking delay end:', error)
    }
  }

  // Get affected activities based on project type and violations
  private getAffectedActivities(projectType: string, violations: any[]): string[] {
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
      }
    }

    const affected = new Set<string>()
    const projectActivities = activities[projectType] || activities.general || {}

    violations.forEach(violation => {
      const violationType = violation.type
      if (projectActivities[violationType]) {
        projectActivities[violationType].forEach(activity => affected.add(activity))
      } else {
        affected.add('general construction activities')
      }
    })

    return Array.from(affected)
  }

  // Calculate alert severity based on violations
  private calculateSeverity(violations: any[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    // Critical if multiple violations or extreme values
    if (violations.length >= 3) return 'CRITICAL'
    
    // Check for extreme violations
    for (const violation of violations) {
      const ratio = violation.value / violation.threshold
      if (ratio > 2) return 'CRITICAL' // Value is more than double the threshold
      if (ratio > 1.5) return 'HIGH'
    }
    
    if (violations.length === 2) return 'HIGH'
    if (violations.length === 1) return 'MEDIUM'
    
    return 'LOW'
  }
}

// Export singleton instance
export const weatherMonitor = new WeatherMonitorService()