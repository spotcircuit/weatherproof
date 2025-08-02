import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// This endpoint is public - subcontractors access it via secure token
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/tasks/subcontractor-update
export async function POST(request: NextRequest) {
  try {
    const { token, ...updateData } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Update token required' }, { status: 400 })
    }

    // Validate token and get task info
    const { data: updateRecord, error: fetchError } = await supabase
      .from('subcontractor_task_updates')
      .select(`
        *,
        project_tasks (
          id,
          name,
          type,
          progress_percentage,
          status
        )
      `)
      .eq('update_token', token)
      .eq('is_processed', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (fetchError || !updateRecord) {
      return NextResponse.json({ 
        error: 'Invalid or expired update token' 
      }, { status: 401 })
    }

    const task = updateRecord.project_tasks

    // Get client IP
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'

    // Create the update record
    const { error: updateError } = await supabase
      .from('subcontractor_task_updates')
      .update({
        progress_percentage: updateData.progress_percentage,
        status_update: updateData.status_update,
        delay_reason: updateData.delay_reason,
        delay_category: updateData.delay_category,
        crew_size_present: updateData.crew_size_present,
        hours_worked: updateData.hours_worked,
        notes: updateData.notes,
        photos: updateData.photos,
        weather_conditions: updateData.weather_conditions,
        submitted_by_name: updateData.submitted_by_name,
        submitted_by_phone: updateData.submitted_by_phone,
        ip_address: ip,
        is_processed: true,
        processed_at: new Date().toISOString(),
      })
      .eq('id', updateRecord.id)

    if (updateError) {
      console.error('Error updating record:', updateError)
      return NextResponse.json({ 
        error: 'Failed to save update' 
      }, { status: 500 })
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
      delayed: !!updateData.delay_reason,
      delay_reason: updateData.delay_reason,
      delay_category: updateData.delay_category || 'other',
      hours_worked: updateData.hours_worked || 0,
      progress_made: updateData.progress_percentage ? 
        updateData.progress_percentage - (task.progress_percentage || 0) : 0,
      notes: updateData.notes,
      photos: updateData.photos || [],
      crew_present: updateData.crew_size_present ? 
        [`Subcontractor crew: ${updateData.crew_size_present} workers`] : [],
      weather_snapshot: updateData.weather_conditions ? 
        { conditions: updateData.weather_conditions } : null,
    }

    await supabase
      .from('task_daily_logs')
      .insert(logData)

    return NextResponse.json({
      success: true,
      message: 'Update submitted successfully',
      task: {
        name: task.name,
        previous_progress: task.progress_percentage,
        new_progress: updateData.progress_percentage || task.progress_percentage,
      }
    })
  } catch (error) {
    console.error('Error processing subcontractor update:', error)
    return NextResponse.json({ 
      error: 'Failed to process update' 
    }, { status: 500 })
  }
}

// GET /api/tasks/subcontractor-update?token=xxx
// Get task info for update form
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Update token required' }, { status: 400 })
    }

    // Get task info
    const { data, error } = await supabase
      .from('subcontractor_task_updates')
      .select(`
        id,
        expires_at,
        project_tasks (
          id,
          name,
          type,
          description,
          progress_percentage,
          status,
          weather_sensitive,
          expected_start,
          expected_end,
          projects (
            name,
            address
          )
        )
      `)
      .eq('update_token', token)
      .eq('is_processed', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !data) {
      return NextResponse.json({ 
        error: 'Invalid or expired update token' 
      }, { status: 401 })
    }

    const task = data.project_tasks[0]

    return NextResponse.json({
      updateId: data.id,
      expiresAt: data.expires_at,
      task: {
        id: task.id,
        name: task.name,
        type: task.type,
        description: task.description,
        progress: task.progress_percentage || 0,
        status: task.status,
        weatherSensitive: task.weather_sensitive,
        expectedStart: task.expected_start,
        expectedEnd: task.expected_end,
      },
      project: {
        name: task.projects[0].name,
        address: task.projects[0].address,
      }
    })
  } catch (error) {
    console.error('Error fetching task info:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch task information' 
    }, { status: 500 })
  }
}