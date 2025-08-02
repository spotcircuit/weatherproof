import { NextRequest, NextResponse } from 'next/server'
import { createServerClientNext } from '@/lib/supabase-server'
import { generateTasksForProject, batchUpdateProjectTaskDelays } from '@/lib/task-generation'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClientNext()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, regenerate = false } = await request.json()

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    // Check if tasks already exist
    const { data: existingTasks } = await supabase
      .from('project_tasks')
      .select('id')
      .eq('project_id', projectId)
      .limit(1)

    if (existingTasks && existingTasks.length > 0 && !regenerate) {
      return NextResponse.json({ 
        message: 'Tasks already exist for this project', 
        exists: true 
      }, { status: 200 })
    }

    // If regenerating, delete existing tasks
    if (regenerate) {
      await supabase
        .from('project_tasks')
        .delete()
        .eq('project_id', projectId)
    }

    // Generate tasks
    const result = await generateTasksForProject(projectId)
    
    if (!result) {
      return NextResponse.json({ 
        error: 'Failed to generate tasks' 
      }, { status: 500 })
    }

    // Insert tasks into database
    const tasksToInsert = result.tasks.map(task => ({
      ...task,
      id: undefined, // Let database generate ID
    }))

    const { data: insertedTasks, error: insertError } = await supabase
      .from('project_tasks')
      .insert(tasksToInsert)
      .select()

    if (insertError) {
      console.error('Error inserting tasks:', insertError)
      return NextResponse.json({ 
        error: 'Failed to save tasks' 
      }, { status: 500 })
    }

    // Update result with actual IDs
    result.tasks = insertedTasks

    // Check weather delays for all tasks
    await batchUpdateProjectTaskDelays(projectId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in task generation:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// GET endpoint to fetch tasks with weather status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClientNext()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    // Fetch project with tasks and latest weather
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_weather!left(*),
        project_tasks(
          *,
          task_daily_logs(*)
        )
      `)
      .eq('id', projectId)
      .order('collected_at', { 
        foreignTable: 'project_weather', 
        ascending: false 
      })
      .limit(1, { foreignTable: 'project_weather' })
      .order('sequence_order', { 
        foreignTable: 'project_tasks', 
        ascending: true 
      })
      .single()

    if (error) {
      console.error('Error fetching project tasks:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch tasks' 
      }, { status: 500 })
    }

    const latestWeather = project.project_weather?.[0]
    const tasksAffectedByWeather = project.project_tasks
      ?.filter((t: any) => t.delayed_today)
      .map((t: any) => t.name) || []

    const result = {
      project: {
        id: project.id,
        name: project.name,
        type: project.project_type,
        weather_today: latestWeather ? {
          wind: latestWeather.wind_speed,
          rain: latestWeather.precipitation_amount,
          temperature: latestWeather.temperature,
          conditions: latestWeather.conditions?.join(', '),
        } : null,
        weather_thresholds: project.weather_thresholds,
        tasks_affected_by_weather: tasksAffectedByWeather,
      },
      tasks: project.project_tasks || [],
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}