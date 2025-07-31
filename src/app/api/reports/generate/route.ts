import { NextRequest, NextResponse } from 'next/server'
import { createServerClientNext } from '@/lib/supabase-server'
import { format } from 'date-fns/format'

// This endpoint is called by n8n to generate reports
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      projectId, 
      reportType = 'insurance_claim',
      periodStart,
      periodEnd,
      includePhotos = false,
      format: outputFormat = 'pdf' 
    } = body
    
    if (!projectId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: projectId, periodStart, periodEnd' },
        { status: 400 }
      )
    }
    
    const supabase = await createServerClientNext()
    
    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*, users(*)')
      .eq('id', projectId)
      .single()
    
    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }
    
    // Get delay events for the period
    const { data: delayEvents, error: delayError } = await supabase
      .from('delay_events')
      .select('*')
      .eq('project_id', projectId)
      .gte('start_time', periodStart)
      .lte('start_time', periodEnd)
      .order('start_time', { ascending: true })
    
    if (delayError) throw delayError
    
    // Get weather readings and photos for each delay
    const delaysWithWeather = []
    for (const delay of delayEvents || []) {
      const { data: weatherData } = await supabase
        .from('weather_readings')
        .select('*')
        .eq('project_id', projectId)
        .gte('timestamp', delay.start_time)
        .lte('timestamp', delay.end_time || delay.start_time)
        .order('timestamp')
      
      // Get photos for this delay
      const { data: photos } = await supabase
        .from('photos')
        .select('*')
        .eq('delay_event_id', delay.id)
        .order('taken_at', { ascending: true })
      
      delaysWithWeather.push({
        ...delay,
        weather_events: weatherData?.map(w => ({
          date: format(new Date(w.timestamp), 'yyyy-MM-dd'),
          time: format(new Date(w.timestamp), 'HH:mm'),
          condition: w.conditions,
          value: w.wind_speed || w.precipitation || w.temperature,
          threshold: 0, // TODO: Get from project thresholds
          source: `${w.source} - Station ${w.station_id}`,
          station_distance: w.station_distance
        })) || [],
        photos: photos ? photos.map(photo => ({
          filename: photo.filename,
          takenAt: photo.taken_at ? new Date(photo.taken_at).toLocaleString() : 'Unknown',
          location: photo.latitude && photo.longitude 
            ? `${photo.latitude.toFixed(6)}, ${photo.longitude.toFixed(6)}`
            : 'Not available',
          device: photo.device_make && photo.device_model
            ? `${photo.device_make} ${photo.device_model}`
            : 'Unknown device',
          caption: photo.caption || '',
          url: photo.file_url
        })) : []
      })
    }
    
    // Calculate summary
    const summary = {
      total_delay_days: delaysWithWeather.length,
      total_hours_lost: delaysWithWeather.reduce((sum, d) => sum + (d.duration_hours || d.labor_hours_lost || 0), 0),
      total_labor_cost: delaysWithWeather.reduce((sum, d) => sum + (d.labor_cost || 0), 0),
      total_equipment_cost: delaysWithWeather.reduce((sum, d) => sum + (d.equipment_cost || 0), 0),
      total_overhead_cost: delaysWithWeather.reduce((sum, d) => sum + (d.overhead_cost || 0), 0),
      total_claim_amount: delaysWithWeather.reduce((sum, d) => sum + (d.total_cost || 0), 0)
    }
    
    // Check if we have a signature
    let signatureData = null
    if (body.signatureData && body.signedBy && body.affidavitText) {
      signatureData = {
        signedBy: body.signedBy,
        signedAt: format(new Date(), 'MMMM dd, yyyy HH:mm'),
        signatureData: body.signatureData,
        affidavitText: body.affidavitText
      }
    }
    
    // Prepare report data
    const reportData = {
      project: {
        name: project.name,
        address: project.address,
        lat: project.latitude,
        lng: project.longitude,
        contract_number: project.external_id,
        policy_number: body.policyNumber
      },
      company: {
        name: project.users.company || 'Unknown Company',
        contact: project.users.name || 'Unknown',
        email: project.users.email,
        phone: project.users.phone || ''
      },
      claim_period: {
        start: periodStart,
        end: periodEnd
      },
      delays: delaysWithWeather.map(d => ({
        date: format(new Date(d.start_time), 'yyyy-MM-dd'),
        hours_lost: d.duration_hours || d.labor_hours_lost || 0,
        crew_size: d.crew_size || project.crew_size,
        labor_cost: d.labor_cost || 0,
        equipment_cost: d.equipment_cost || 0,
        overhead_cost: d.overhead_cost || 0,
        total_cost: d.total_cost || 0,
        activities_affected: d.affected_activities || [],
        weather_events: d.weather_events,
        photos: d.photos || []
      })),
      weather_thresholds: project.weather_thresholds,
      summary,
      signature: signatureData || undefined
    }
    
    let reportUrl = ''
    let reportContent = null
    
    if (outputFormat === 'pdf') {
      // Generate PDF with dynamic import
      const { reportGenerator } = await import('@/services/report-generator')
      const pdfBlob = await reportGenerator.generateInsuranceReport(reportData)
      
      // TODO: Upload to S3 or Supabase storage
      // For now, return base64
      const buffer = await pdfBlob.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      reportContent = base64
      
    } else if (outputFormat === 'csv') {
      // Generate CSV with dynamic import
      const { reportGenerator } = await import('@/services/report-generator')
      const csv = await reportGenerator.generateCSVReport(reportData)
      reportContent = csv
    }
    
    // Save report record
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        project_id: projectId,
        user_id: project.user_id,
        report_type: reportType.toUpperCase(),
        period_start: periodStart,
        period_end: periodEnd,
        document_url: reportUrl,
        metadata: {
          delays_count: delaysWithWeather.length,
          format: outputFormat,
          generated_by: 'n8n'
        },
        total_delay_hours: summary.total_hours_lost,
        total_cost: summary.total_claim_amount,
        status: 'COMPLETED',
        claim_amount: summary.total_claim_amount,
        policy_number: body.policyNumber,
        insurer_name: body.insurerName
      })
      .select()
      .single()
    
    if (reportError) throw reportError
    
    // Return report data for n8n
    return NextResponse.json({
      success: true,
      reportId: report.id,
      project: {
        id: project.id,
        name: project.name,
        address: project.address
      },
      period: {
        start: periodStart,
        end: periodEnd
      },
      summary: {
        delaysCount: delaysWithWeather.length,
        hoursLost: summary.total_hours_lost,
        totalCost: summary.total_claim_amount,
        breakdown: {
          labor: summary.total_labor_cost,
          equipment: summary.total_equipment_cost,
          overhead: summary.total_overhead_cost
        }
      },
      delays: delaysWithWeather.map(d => ({
        date: format(new Date(d.start_time), 'yyyy-MM-dd'),
        duration: d.duration_hours || d.labor_hours_lost,
        cost: d.total_cost,
        conditions: d.weather_condition,
        verified: d.verified
      })),
      report: {
        format: outputFormat,
        content: reportContent, // Base64 PDF or CSV string
        url: reportUrl || null
      }
    })
    
  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate report'
      },
      { status: 500 }
    )
  }
}