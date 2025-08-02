import { NextRequest, NextResponse } from 'next/server'
import { createServerClientNext } from '@/lib/supabase-server'
import { evaluateAllProjectDelays, evaluateProjectTaskDelays } from '@/lib/task-delay-evaluation'

// POST /api/tasks/evaluate-delays
// This endpoint should be called by a cron job daily
export async function POST(request: NextRequest) {
  try {
    // Check for cron secret or admin authentication
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // If not cron, check for authenticated user
      const supabase = await createServerClientNext()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      // Check if user is admin (optional - you might want to add an admin check)
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        
      if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    }

    const { projectId } = await request.json()

    if (projectId) {
      // Evaluate specific project
      const results = await evaluateProjectTaskDelays(projectId)
      
      return NextResponse.json({
        success: true,
        projectId,
        tasksEvaluated: results.length,
        results: results.map(r => ({
          taskName: r.taskName,
          previousStatus: r.previousStatus,
          newStatus: r.newStatus,
          delayDays: r.delayDays,
          forecastRisk: r.forecastRisk,
          weatherExceedsThresholds: r.weatherExceedsThresholds,
          delayReason: r.delayReason,
        }))
      })
    } else {
      // Evaluate all projects
      const summary = await evaluateAllProjectDelays()
      
      return NextResponse.json({
        success: true,
        summary,
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error('Error evaluating task delays:', error)
    return NextResponse.json({ 
      error: 'Failed to evaluate delays',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET /api/tasks/evaluate-delays?projectId=xxx
// Get delay evaluation status for a project
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

    // Get tasks with delay information
    const { data: tasks, error } = await supabase
      .from('project_tasks')
      .select(`
        id,
        name,
        type,
        status,
        delay_days,
        forecast_delay_risk,
        delayed_today,
        delay_reason,
        last_delay_evaluation,
        weather_sensitive,
        weather_thresholds,
        expected_start,
        expected_end,
        actual_start,
        actual_end,
        progress_percentage
      `)
      .eq('project_id', projectId)
      .order('sequence_order')

    if (error) {
      throw error
    }

    // Get latest weather
    const { data: weather } = await supabase
      .from('project_weather')
      .select('*')
      .eq('project_id', projectId)
      .eq('data_source', 'observation')
      .order('collected_at', { ascending: false })
      .limit(1)
      .single()

    // Get forecast summary
    const { data: forecasts } = await supabase
      .from('project_weather')
      .select('collected_at, wind_speed, precipitation_amount, temperature')
      .eq('project_id', projectId)
      .eq('data_source', 'forecast')
      .gt('collected_at', new Date().toISOString())
      .order('collected_at')
      .limit(10)

    return NextResponse.json({
      tasks,
      currentWeather: weather,
      upcomingForecasts: forecasts,
      summary: {
        totalTasks: tasks?.length || 0,
        delayedTasks: tasks?.filter(t => t.status === 'delayed').length || 0,
        atRiskTasks: tasks?.filter(t => t.status === 'at_risk').length || 0,
        tasksWithForecastRisk: tasks?.filter(t => t.forecast_delay_risk).length || 0,
        tasksDelayedToday: tasks?.filter(t => t.delayed_today).length || 0,
      }
    })
  } catch (error) {
    console.error('Error fetching delay status:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch delay status' 
    }, { status: 500 })
  }
}