// Task delay evaluation service
import { createClient } from '@supabase/supabase-js'
import { ProjectTask, TaskStatus, WeatherThresholds } from '@/types/tasks'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface TaskDelayEvaluationResult {
  taskId: string
  taskName: string
  previousStatus: TaskStatus
  newStatus: TaskStatus
  delayDays: number
  forecastRisk: boolean
  weatherExceedsThresholds: boolean
  delayReason?: string
}

// Check if current weather exceeds task thresholds
export async function checkWeatherAgainstThresholds(
  projectId: string,
  thresholds: WeatherThresholds
): Promise<{ exceeds: boolean; reasons: string[] }> {
  // Get latest weather for project
  const { data: weather } = await supabase
    .from('project_weather')
    .select('*')
    .eq('project_id', projectId)
    .eq('data_source', 'observation')
    .order('collected_at', { ascending: false })
    .limit(1)
    .single()

  if (!weather) {
    return { exceeds: false, reasons: [] }
  }

  const reasons: string[] = []

  if (thresholds.wind_speed && weather.wind_speed > thresholds.wind_speed) {
    reasons.push(`Wind ${weather.wind_speed}mph exceeds ${thresholds.wind_speed}mph`)
  }

  if (thresholds.precipitation && weather.precipitation_amount > thresholds.precipitation) {
    reasons.push(`Precipitation ${weather.precipitation_amount}" exceeds ${thresholds.precipitation}"`)
  }

  if (thresholds.temperature_min && weather.temperature < thresholds.temperature_min) {
    reasons.push(`Temperature ${weather.temperature}°F below ${thresholds.temperature_min}°F`)
  }

  if (thresholds.temperature_max && weather.temperature > thresholds.temperature_max) {
    reasons.push(`Temperature ${weather.temperature}°F above ${thresholds.temperature_max}°F`)
  }

  if (thresholds.humidity_max && weather.humidity > thresholds.humidity_max) {
    reasons.push(`Humidity ${weather.humidity}% exceeds ${thresholds.humidity_max}%`)
  }

  if (thresholds.visibility_min && weather.visibility < thresholds.visibility_min) {
    reasons.push(`Visibility ${weather.visibility}mi below ${thresholds.visibility_min}mi`)
  }

  return { exceeds: reasons.length > 0, reasons }
}

// Check if forecast indicates risk for task
export async function checkForecastRisk(
  projectId: string,
  thresholds: WeatherThresholds,
  hoursAhead: number = 72
): Promise<boolean> {
  const cutoffTime = new Date()
  cutoffTime.setHours(cutoffTime.getHours() + hoursAhead)

  const { data: forecasts } = await supabase
    .from('project_weather')
    .select('*')
    .eq('project_id', projectId)
    .eq('data_source', 'forecast')
    .gt('collected_at', new Date().toISOString())
    .lte('collected_at', cutoffTime.toISOString())

  if (!forecasts || forecasts.length === 0) {
    return false
  }

  // Check if any forecast exceeds thresholds
  return forecasts.some(forecast => {
    if (thresholds.wind_speed && forecast.wind_speed > thresholds.wind_speed) return true
    if (thresholds.precipitation && forecast.precipitation_amount > thresholds.precipitation) return true
    if (thresholds.temperature_min && forecast.temperature < thresholds.temperature_min) return true
    if (thresholds.temperature_max && forecast.temperature > thresholds.temperature_max) return true
    if (thresholds.humidity_max && forecast.humidity > thresholds.humidity_max) return true
    if (thresholds.visibility_min && forecast.visibility < thresholds.visibility_min) return true
    return false
  })
}

// Evaluate delay for a single task
export async function evaluateTaskDelay(task: ProjectTask): Promise<TaskDelayEvaluationResult> {
  const result: TaskDelayEvaluationResult = {
    taskId: task.id,
    taskName: task.name,
    previousStatus: task.status,
    newStatus: task.status,
    delayDays: 0,
    forecastRisk: false,
    weatherExceedsThresholds: false,
  }

  // Skip if task is completed or cancelled
  if (task.status === 'completed' || task.status === 'cancelled') {
    return result
  }

  // Calculate delay days
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (task.expected_start) {
    const expectedStart = new Date(task.expected_start)
    expectedStart.setHours(0, 0, 0, 0)

    // Task hasn't started but should have
    if (!task.actual_start && expectedStart < today) {
      result.delayDays = Math.floor((today.getTime() - expectedStart.getTime()) / (1000 * 60 * 60 * 24))
    }
  }

  if (task.expected_end && task.actual_start && !task.actual_end) {
    const expectedEnd = new Date(task.expected_end)
    expectedEnd.setHours(0, 0, 0, 0)

    // Task is running but past expected end
    if (expectedEnd < today) {
      result.delayDays = Math.floor((today.getTime() - expectedEnd.getTime()) / (1000 * 60 * 60 * 24))
    }
  }

  // Check weather if task is weather sensitive
  if (task.weather_sensitive && task.weather_thresholds) {
    const weatherCheck = await checkWeatherAgainstThresholds(task.project_id, task.weather_thresholds)
    result.weatherExceedsThresholds = weatherCheck.exceeds
    if (weatherCheck.exceeds) {
      result.delayReason = `Weather: ${weatherCheck.reasons.join(', ')}`
    }

    // Check forecast risk
    result.forecastRisk = await checkForecastRisk(task.project_id, task.weather_thresholds)
  }

  // Determine new status
  if (!task.actual_start) {
    // Task hasn't started
    if (result.delayDays > 0) {
      result.newStatus = 'delayed'
    } else if (result.forecastRisk) {
      result.newStatus = 'at_risk'
    } else {
      result.newStatus = 'pending'
    }
  } else {
    // Task is in progress
    if (result.delayDays > 3 || result.weatherExceedsThresholds) {
      result.newStatus = 'delayed'
    } else if (result.delayDays > 1 || result.forecastRisk) {
      result.newStatus = 'at_risk'
    } else if (task.progress_percentage >= 80) {
      result.newStatus = 'on_track'
    } else {
      // Check progress vs expected progress
      if (task.expected_duration_days > 0 && task.expected_start) {
        const startDate = new Date(task.expected_start)
        const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        const expectedProgress = Math.min((daysSinceStart / task.expected_duration_days) * 100, 100)
        
        if (task.progress_percentage >= expectedProgress - 10) {
          result.newStatus = 'on_track'
        } else if (task.progress_percentage >= expectedProgress - 25) {
          result.newStatus = 'at_risk'
        } else {
          result.newStatus = 'delayed'
        }
      } else {
        result.newStatus = 'in_progress'
      }
    }
  }

  return result
}

// Evaluate all tasks for a project
export async function evaluateProjectTaskDelays(projectId: string): Promise<TaskDelayEvaluationResult[]> {
  // Get all active tasks for project
  const { data: tasks, error } = await supabase
    .from('project_tasks')
    .select('*')
    .eq('project_id', projectId)
    .not('status', 'in', '("completed","cancelled")')
    .order('sequence_order')

  if (error || !tasks) {
    console.error('Error fetching tasks:', error)
    return []
  }

  const results: TaskDelayEvaluationResult[] = []

  for (const task of tasks) {
    const evaluation = await evaluateTaskDelay(task)
    results.push(evaluation)

    // Update task in database if status changed
    if (evaluation.newStatus !== evaluation.previousStatus || 
        evaluation.delayDays !== task.delay_days ||
        evaluation.forecastRisk !== task.forecast_delay_risk) {
      
      const updateData: any = {
        status: evaluation.newStatus,
        delay_days: evaluation.delayDays,
        forecast_delay_risk: evaluation.forecastRisk,
        delayed_today: evaluation.weatherExceedsThresholds,
        last_delay_evaluation: new Date().toISOString(),
      }

      if (evaluation.delayReason) {
        updateData.delay_reason = evaluation.delayReason
      }

      const { error: updateError } = await supabase
        .from('project_tasks')
        .update(updateData)
        .eq('id', task.id)

      if (updateError) {
        console.error('Error updating task:', updateError)
      }

      // Create daily log entry if delayed
      if (evaluation.weatherExceedsThresholds || evaluation.delayDays > 0) {
        const logData = {
          task_id: task.id,
          log_date: new Date().toISOString().split('T')[0],
          delayed: true,
          delay_reason: evaluation.delayReason,
          delay_category: evaluation.weatherExceedsThresholds ? 'weather' : 'other',
          hours_worked: 0,
          progress_made: 0,
          notes: `Task ${evaluation.newStatus}: ${evaluation.delayReason || 'Schedule delay'}`,
        }

        await supabase
          .from('task_daily_logs')
          .upsert(logData, { onConflict: 'task_id,log_date' })
      }
    }

    // Handle blocking dependencies
    if (evaluation.newStatus === 'delayed' && task.blocks && task.blocks.length > 0) {
      // Mark dependent tasks as at risk
      await supabase
        .from('project_tasks')
        .update({ 
          status: 'at_risk',
          delay_reason: `Blocked by: ${task.name}`
        })
        .in('id', task.blocks)
        .not('status', 'in', '("completed","cancelled","delayed")')
    }
  }

  return results
}

// Evaluate all projects (for cron job)
export async function evaluateAllProjectDelays(): Promise<{
  projectsEvaluated: number
  tasksEvaluated: number
  tasksDelayed: number
}> {
  // Get all active projects
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, name')
    .eq('status', 'active')

  if (error || !projects) {
    console.error('Error fetching projects:', error)
    return { projectsEvaluated: 0, tasksEvaluated: 0, tasksDelayed: 0 }
  }

  let totalTasksEvaluated = 0
  let totalTasksDelayed = 0

  for (const project of projects) {
    console.log(`Evaluating delays for project: ${project.name}`)
    const results = await evaluateProjectTaskDelays(project.id)
    
    totalTasksEvaluated += results.length
    totalTasksDelayed += results.filter(r => r.newStatus === 'delayed').length
  }

  return {
    projectsEvaluated: projects.length,
    tasksEvaluated: totalTasksEvaluated,
    tasksDelayed: totalTasksDelayed,
  }
}

// Process subcontractor updates
export async function processSubcontractorUpdate(
  updateToken: string,
  updateData: {
    progress_percentage?: number
    status_update?: TaskStatus
    delay_reason?: string
    delay_category?: string
    crew_size_present?: number
    hours_worked?: number
    notes?: string
    photos?: string[]
    weather_conditions?: string
    submitted_by_name?: string
    submitted_by_phone?: string
  }
): Promise<{ success: boolean; error?: string }> {
  // Find the update record
  const { data: updateRecord, error: fetchError } = await supabase
    .from('subcontractor_task_updates')
    .select('*, project_tasks(*)')
    .eq('update_token', updateToken)
    .eq('is_processed', false)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (fetchError || !updateRecord) {
    return { success: false, error: 'Invalid or expired update token' }
  }

  const task = updateRecord.project_tasks

  // Create the update record
  const { error: insertError } = await supabase
    .from('subcontractor_task_updates')
    .update({
      ...updateData,
      is_processed: true,
      processed_at: new Date().toISOString(),
    })
    .eq('id', updateRecord.id)

  if (insertError) {
    return { success: false, error: 'Failed to save update' }
  }

  // Update the task if needed
  const taskUpdates: any = {}
  
  if (updateData.progress_percentage !== undefined) {
    taskUpdates.progress_percentage = updateData.progress_percentage
  }
  
  if (updateData.status_update) {
    taskUpdates.status = updateData.status_update
  }

  if (Object.keys(taskUpdates).length > 0) {
    await supabase
      .from('project_tasks')
      .update(taskUpdates)
      .eq('id', task.id)
  }

  // Create daily log entry
  const logData = {
    task_id: task.id,
    log_date: new Date().toISOString().split('T')[0],
    delayed: updateData.delay_reason ? true : false,
    delay_reason: updateData.delay_reason,
    delay_category: updateData.delay_category,
    hours_worked: updateData.hours_worked || 0,
    progress_made: updateData.progress_percentage ? 
      updateData.progress_percentage - (task.progress_percentage || 0) : 0,
    notes: updateData.notes,
    photos: updateData.photos || [],
    weather_snapshot: updateData.weather_conditions ? 
      { conditions: updateData.weather_conditions } : undefined,
  }

  await supabase
    .from('task_daily_logs')
    .insert(logData)

  return { success: true }
}