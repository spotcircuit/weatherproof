import { NextRequest, NextResponse } from 'next/server'
import { createServerClientNext } from '@/lib/supabase-server'
import { format } from 'date-fns'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClientNext()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId } = await params
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const outputFormat = searchParams.get('format') || 'json'

    // Fetch project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        *,
        companies (
          name,
          address,
          phone,
          email,
          insurance_company,
          policy_number
        )
      `)
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Build query for task delays
    let taskQuery = supabase
      .from('project_tasks')
      .select(`
        *,
        task_daily_logs!left (
          id,
          log_date,
          delayed,
          delay_reason,
          delay_category,
          weather_snapshot,
          hours_worked,
          crew_present,
          equipment_used,
          notes,
          photos
        ),
        task_crew_assignments!left (
          id,
          is_outsourced,
          outsource_company_name,
          outsource_crew_size,
          outsource_rate,
          outsource_rate_type,
          actual_hours_worked
        ),
        task_equipment_assignments!left (
          id,
          is_rented,
          rental_company_name,
          rental_equipment_type,
          rental_rate,
          rental_rate_type,
          actual_hours_used
        )
      `)
      .eq('project_id', projectId)
      .eq('task_daily_logs.delayed', true)

    if (startDate && endDate) {
      taskQuery = taskQuery
        .gte('task_daily_logs.log_date', startDate)
        .lte('task_daily_logs.log_date', endDate)
    }

    const { data: tasks, error: tasksError } = await taskQuery

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError)
      return NextResponse.json({ error: 'Failed to fetch task data' }, { status: 500 })
    }

    // Fetch weather alerts for the period
    let alertsQuery = supabase
      .from('project_weather_alerts')
      .select('*')
      .eq('project_id', projectId)
      .order('onset', { ascending: false })

    if (startDate && endDate) {
      alertsQuery = alertsQuery
        .gte('onset', startDate)
        .lte('expires', endDate)
    }

    const { data: weatherAlerts } = await alertsQuery

    // Calculate delay statistics
    const delayedTasks = tasks?.filter(t => t.task_daily_logs && t.task_daily_logs.length > 0) || []
    const totalDelayDays = delayedTasks.reduce((sum, task) => sum + (task.delay_days || 0), 0)
    const weatherDelays = delayedTasks.filter(t => 
      t.task_daily_logs?.some((log: any) => log.delay_category === 'weather')
    ).length

    // Calculate cost impact
    let totalCostImpact = 0
    delayedTasks.forEach(task => {
      // Add task-level cost impact
      totalCostImpact += task.cost_impact || 0

      // Calculate crew costs
      task.task_crew_assignments?.forEach((crew: any) => {
        if (crew.is_outsourced && crew.outsource_rate && crew.actual_hours_worked) {
          const rate = crew.outsource_rate
          const hours = crew.actual_hours_worked
          if (crew.outsource_rate_type === 'hourly') {
            totalCostImpact += rate * hours
          } else if (crew.outsource_rate_type === 'daily') {
            totalCostImpact += rate * (hours / 8)
          }
        }
      })

      // Calculate equipment costs
      task.task_equipment_assignments?.forEach((equipment: any) => {
        if (equipment.is_rented && equipment.rental_rate && equipment.actual_hours_used) {
          const rate = equipment.rental_rate
          const hours = equipment.actual_hours_used
          if (equipment.rental_rate_type === 'hourly') {
            totalCostImpact += rate * hours
          } else if (equipment.rental_rate_type === 'daily') {
            totalCostImpact += rate * (hours / 8)
          }
        }
      })
    })

    // Build report data
    const reportData = {
      reportMetadata: {
        generatedAt: new Date().toISOString(),
        reportPeriod: {
          start: startDate || project.start_date,
          end: endDate || new Date().toISOString()
        }
      },
      project: {
        id: project.id,
        name: project.name,
        address: project.address,
        type: project.project_type,
        startDate: project.start_date,
        endDate: project.end_date,
        company: project.companies
      },
      delaySummary: {
        totalDelayedTasks: delayedTasks.length,
        totalDelayDays: totalDelayDays,
        weatherRelatedDelays: weatherDelays,
        totalCostImpact: totalCostImpact,
        delaysByCategory: {
          weather: delayedTasks.filter(t => t.task_daily_logs?.some((l: any) => l.delay_category === 'weather')).length,
          crew: delayedTasks.filter(t => t.task_daily_logs?.some((l: any) => l.delay_category === 'crew')).length,
          equipment: delayedTasks.filter(t => t.task_daily_logs?.some((l: any) => l.delay_category === 'equipment')).length,
          material: delayedTasks.filter(t => t.task_daily_logs?.some((l: any) => l.delay_category === 'material')).length,
          other: delayedTasks.filter(t => t.task_daily_logs?.some((l: any) => l.delay_category === 'other')).length
        }
      },
      weatherAlerts: weatherAlerts?.map(alert => ({
        id: alert.id,
        type: alert.event_type,
        severity: alert.severity,
        headline: alert.headline,
        onset: alert.onset,
        expires: alert.expires
      })) || [],
      detailedDelays: delayedTasks.map(task => ({
        task: {
          id: task.id,
          name: task.name,
          type: task.type,
          weatherSensitive: task.weather_sensitive,
          weatherThresholds: task.weather_thresholds,
          delayDays: task.delay_days,
          costImpact: task.cost_impact
        },
        dailyLogs: task.task_daily_logs?.map((log: any) => ({
          date: log.log_date,
          delayReason: log.delay_reason,
          delayCategory: log.delay_category,
          hoursLost: 8 - (log.hours_worked || 0),
          weatherConditions: log.weather_snapshot,
          crewPresent: log.crew_present?.length || 0,
          notes: log.notes,
          photos: log.photos
        })) || [],
        crewImpact: task.task_crew_assignments?.map((crew: any) => ({
          type: crew.is_outsourced ? 'outsourced' : 'internal',
          company: crew.outsource_company_name,
          size: crew.outsource_crew_size || 1,
          hoursWorked: crew.actual_hours_worked,
          rate: crew.outsource_rate,
          rateType: crew.outsource_rate_type,
          cost: crew.outsource_rate && crew.actual_hours_worked
            ? crew.outsource_rate_type === 'hourly'
              ? crew.outsource_rate * crew.actual_hours_worked
              : crew.outsource_rate * (crew.actual_hours_worked / 8)
            : 0
        })) || [],
        equipmentImpact: task.task_equipment_assignments?.map((equip: any) => ({
          type: equip.is_rented ? 'rented' : 'owned',
          name: equip.rental_equipment_type,
          company: equip.rental_company_name,
          hoursUsed: equip.actual_hours_used,
          rate: equip.rental_rate,
          rateType: equip.rental_rate_type,
          cost: equip.rental_rate && equip.actual_hours_used
            ? equip.rental_rate_type === 'hourly'
              ? equip.rental_rate * equip.actual_hours_used
              : equip.rental_rate * (equip.actual_hours_used / 8)
            : 0
        })) || []
      }))
    }

    // Return based on format
    if (outputFormat === 'csv') {
      // Generate CSV
      const csv = generateCSV(reportData)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="claim-report-${project.name}-${format(new Date(), 'yyyy-MM-dd')}.csv"`
        }
      })
    } else {
      // Return JSON
      return NextResponse.json(reportData)
    }
  } catch (error) {
    console.error('Error generating claim report:', error)
    return NextResponse.json({ 
      error: 'Failed to generate report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function generateCSV(data: any): string {
  const lines: string[] = []
  
  // Header
  lines.push('Weather Delay Claim Report')
  lines.push(`Project: ${data.project.name}`)
  lines.push(`Address: ${data.project.address}`)
  lines.push(`Report Period: ${data.reportMetadata.reportPeriod.start} to ${data.reportMetadata.reportPeriod.end}`)
  lines.push('')
  
  // Summary
  lines.push('DELAY SUMMARY')
  lines.push(`Total Delayed Tasks,${data.delaySummary.totalDelayedTasks}`)
  lines.push(`Total Delay Days,${data.delaySummary.totalDelayDays}`)
  lines.push(`Weather-Related Delays,${data.delaySummary.weatherRelatedDelays}`)
  lines.push(`Total Cost Impact,$${data.delaySummary.totalCostImpact.toFixed(2)}`)
  lines.push('')
  
  // Detailed delays
  lines.push('DETAILED DELAY LOG')
  lines.push('Task Name,Task Type,Date,Delay Category,Delay Reason,Hours Lost,Weather Conditions,Cost Impact')
  
  data.detailedDelays.forEach((task: any) => {
    task.dailyLogs.forEach((log: any) => {
      const weather = log.weatherConditions 
        ? `"${log.weatherConditions.temperature}°F, Wind: ${log.weatherConditions.wind_speed}mph, Precip: ${log.weatherConditions.precipitation_amount}\""`
        : 'N/A'
      
      lines.push([
        `"${task.task.name}"`,
        task.task.type,
        log.date,
        log.delayCategory,
        `"${log.delayReason || 'Not specified'}"`,
        log.hoursLost,
        weather,
        `$${(task.task.costImpact || 0).toFixed(2)}`
      ].join(','))
    })
  })
  
  return lines.join('\n')
}