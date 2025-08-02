import { createClient } from '@/lib/supabase'
import { 
  ProjectTask, 
  TaskTemplate, 
  TaskGenerationResult,
  WeatherThresholds,
  TaskType 
} from '@/types/tasks'
import { addDays, format } from 'date-fns'

// Equipment mapping for different task types
const TASK_EQUIPMENT_MAP: Record<string, string[]> = {
  mobilization: ['Truck', 'Safety Equipment'],
  tear_off: ['Dumpster', 'Tear-off Tools', 'Safety Harness'],
  deck_repair: ['Circular Saw', 'Drill', 'Hammer'],
  underlayment: ['Nail Gun', 'Utility Knife', 'Chalk Line'],
  torch_weld: ['Propane Torch', 'Fire Extinguisher', 'Safety Equipment'],
  membrane_install: ['Roller', 'Adhesive Sprayer', 'Seam Roller'],
  flashing: ['Tin Snips', 'Soldering Iron', 'Caulk Gun'],
  framing: ['Nail Gun', 'Circular Saw', 'Level', 'Square'],
  concrete_pour: ['Concrete Mixer', 'Vibrator', 'Screed', 'Trowel'],
  concrete_finish: ['Power Trowel', 'Edger', 'Broom'],
  rebar_install: ['Rebar Cutter', 'Tie Wire Tool', 'Rebar Bender'],
  forming: ['Form Stakes', 'Form Oil', 'Hammer Drill'],
  excavation: ['Excavator', 'Dump Truck', 'Compactor'],
};

// Crew size recommendations by task type
const TASK_CREW_SIZE: Record<string, number> = {
  mobilization: 2,
  tear_off: 4,
  deck_repair: 3,
  underlayment: 3,
  torch_weld: 4,
  membrane_install: 4,
  flashing: 2,
  inspection: 1,
  cleanup: 2,
  framing: 6,
  concrete_pour: 6,
  concrete_finish: 3,
  rebar_install: 3,
  forming: 4,
  excavation: 3,
};

export async function generateTasksForProject(projectId: string): Promise<TaskGenerationResult | null> {
  const supabase = createClient()

  try {
    // Fetch project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        *,
        project_weather!left(*)
      `)
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      console.error('Error fetching project:', projectError)
      return null
    }

    // Fetch task templates for this project type
    const { data: templates, error: templatesError } = await supabase
      .from('task_templates')
      .select('*')
      .eq('project_type', project.project_type)
      .order('sequence_order')

    if (templatesError || !templates || templates.length === 0) {
      console.error('No templates found for project type:', project.project_type)
      return null
    }

    // Fetch latest weather data
    const latestWeather = project.project_weather?.[0]

    // Generate tasks from templates
    const tasks: ProjectTask[] = []
    let currentDate = new Date(project.start_date)

    for (const template of templates) {
      const taskEndDate = addDays(currentDate, template.typical_duration_days - 1)
      
      const task: Partial<ProjectTask> = {
        project_id: projectId,
        name: template.task_name,
        type: template.task_type,
        sequence_order: template.sequence_order,
        expected_start: format(currentDate, 'yyyy-MM-dd'),
        expected_end: format(taskEndDate, 'yyyy-MM-dd'),
        expected_duration_days: template.typical_duration_days,
        weather_sensitive: template.weather_sensitive,
        weather_thresholds: template.weather_thresholds || project.weather_thresholds,
        status: 'pending',
        delayed_today: false,
        total_delay_days: 0,
        crew_count: template.typical_crew_size,
        equipment_count: template.typical_equipment?.length || 0,
        progress_percentage: 0,
        depends_on: [],
        blocks: [],
      }

      // Check if task is delayed by current weather
      if (task.weather_sensitive && latestWeather && task.weather_thresholds) {
        const delayReasons = checkWeatherThresholds(latestWeather, task.weather_thresholds)
        if (delayReasons.length > 0) {
          task.delayed_today = true
          task.delay_reason = delayReasons.join(', ')
        }
      }

      tasks.push(task as ProjectTask)
      currentDate = addDays(taskEndDate, 1)
    }

    // Set up dependencies based on sequence
    for (let i = 1; i < tasks.length; i++) {
      tasks[i].depends_on = [tasks[i - 1].id || `temp-${i - 1}`]
      tasks[i - 1].blocks = [tasks[i].id || `temp-${i}`]
    }

    // Identify weather-affected tasks
    const tasksAffectedByWeather = tasks
      .filter(t => t.delayed_today)
      .map(t => t.name)

    return {
      project: {
        id: project.id,
        name: project.name,
        type: project.project_type,
        weather_today: {
          wind: latestWeather?.wind_speed,
          rain: latestWeather?.precipitation_amount,
          temperature: latestWeather?.temperature,
          conditions: latestWeather?.conditions?.join(', '),
        },
        weather_thresholds: project.weather_thresholds,
        tasks_affected_by_weather: tasksAffectedByWeather,
      },
      tasks,
    }
  } catch (error) {
    console.error('Error generating tasks:', error)
    return null
  }
}

export function checkWeatherThresholds(
  weather: any,
  thresholds: WeatherThresholds
): string[] {
  const reasons: string[] = []

  if (thresholds.wind_speed && weather.wind_speed > thresholds.wind_speed) {
    reasons.push(`Wind exceeded threshold (${weather.wind_speed} > ${thresholds.wind_speed} mph)`)
  }

  if (thresholds.precipitation !== undefined && weather.precipitation_amount > thresholds.precipitation) {
    reasons.push(`Precipitation exceeded threshold (${weather.precipitation_amount}" > ${thresholds.precipitation}")`)
  }

  if (thresholds.temperature_min && weather.temperature < thresholds.temperature_min) {
    reasons.push(`Temperature below minimum (${weather.temperature}°F < ${thresholds.temperature_min}°F)`)
  }

  if (thresholds.temperature_max && weather.temperature > thresholds.temperature_max) {
    reasons.push(`Temperature above maximum (${weather.temperature}°F > ${thresholds.temperature_max}°F)`)
  }

  return reasons
}

export async function assignCrewAndEquipment(
  taskId: string,
  availableCrew: string[],
  availableEquipment: string[]
): Promise<{ crew: string[], equipment: string[] }> {
  const supabase = createClient()

  // Fetch task details
  const { data: task } = await supabase
    .from('project_tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  if (!task) {
    return { crew: [], equipment: [] }
  }

  // Get recommended equipment for this task type
  const recommendedEquipment = TASK_EQUIPMENT_MAP[task.type] || []
  
  // Get recommended crew size
  const recommendedCrewSize = TASK_CREW_SIZE[task.type] || 2

  // Assign crew (take the first N available)
  const assignedCrew = availableCrew.slice(0, recommendedCrewSize)

  // Assign equipment (match available with recommended)
  const assignedEquipment = availableEquipment.filter(eq => 
    recommendedEquipment.some(rec => 
      eq.toLowerCase().includes(rec.toLowerCase())
    )
  )

  // Update the task with assignments
  await supabase
    .from('project_tasks')
    .update({
      assigned_crew: assignedCrew,
      assigned_equipment: assignedEquipment,
      crew_count: assignedCrew.length,
      equipment_count: assignedEquipment.length,
    })
    .eq('id', taskId)

  return {
    crew: assignedCrew,
    equipment: assignedEquipment,
  }
}

export async function updateTaskDelayStatus(taskId: string): Promise<void> {
  const supabase = createClient()

  // Fetch task with project weather data
  const { data: task } = await supabase
    .from('project_tasks')
    .select(`
      *,
      projects!inner(
        weather_thresholds,
        project_weather!left(*)
      )
    `)
    .eq('id', taskId)
    .single()

  if (!task || !task.weather_sensitive) return

  const latestWeather = task.projects.project_weather?.[0]
  if (!latestWeather) return

  const thresholds = task.weather_thresholds || task.projects.weather_thresholds
  const delayReasons = checkWeatherThresholds(latestWeather, thresholds)

  const isDelayed = delayReasons.length > 0

  // Update task delay status
  await supabase
    .from('project_tasks')
    .update({
      delayed_today: isDelayed,
      delay_reason: isDelayed ? delayReasons.join(', ') : null,
      total_delay_days: isDelayed ? (task.total_delay_days + 1) : task.total_delay_days,
    })
    .eq('id', taskId)

  // Create daily log entry
  await supabase
    .from('task_daily_logs')
    .upsert({
      task_id: taskId,
      log_date: format(new Date(), 'yyyy-MM-dd'),
      delayed: isDelayed,
      delay_reason: isDelayed ? delayReasons.join(', ') : null,
      delay_category: isDelayed ? 'weather' : null,
      weather_snapshot: {
        temperature: latestWeather.temperature,
        wind_speed: latestWeather.wind_speed,
        precipitation: latestWeather.precipitation_amount,
        conditions: latestWeather.conditions?.join(', '),
        humidity: latestWeather.humidity,
        visibility: latestWeather.visibility,
      },
    }, {
      onConflict: 'task_id,log_date'
    })
}

export async function batchUpdateProjectTaskDelays(projectId: string): Promise<void> {
  const supabase = createClient()

  // Fetch all weather-sensitive tasks for the project
  const { data: tasks } = await supabase
    .from('project_tasks')
    .select('id')
    .eq('project_id', projectId)
    .eq('weather_sensitive', true)
    .in('status', ['pending', 'in_progress'])

  if (!tasks) return

  // Update each task's delay status
  await Promise.all(
    tasks.map(task => updateTaskDelayStatus(task.id))
  )
}