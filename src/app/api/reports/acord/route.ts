import { NextRequest, NextResponse } from 'next/server'
import { createServerClientNext } from '@/lib/supabase-server'
import { acordMapper } from '@/services/acord-mapper'
import { format } from 'date-fns/format'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reportId, format: outputFormat = 'xml' } = body
    
    if (!reportId) {
      return NextResponse.json(
        { success: false, error: 'Missing reportId' },
        { status: 400 }
      )
    }
    
    const supabase = await createServerClientNext()
    
    // Get report with all related data
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select(`
        *,
        projects (
          *,
          users (*)
        )
      `)
      .eq('id', reportId)
      .single()
    
    if (reportError || !report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      )
    }
    
    // Get delay events with weather data and photos
    const { data: delayEvents } = await supabase
      .from('delay_events')
      .select('*')
      .eq('project_id', report.project_id)
      .gte('start_time', report.period_start)
      .lte('start_time', report.period_end)
      .order('start_time', { ascending: true })
    
    // Get weather readings and photos for each delay
    const delaysWithDetails = []
    for (const delay of delayEvents || []) {
      const { data: weatherData } = await supabase
        .from('project_weather')
        .select('*')
        .eq('project_id', report.project_id)
        .gte('collected_at', delay.start_time)
        .lte('collected_at', delay.end_time || delay.start_time)
        .order('collected_at')
      
      const { data: photos } = await supabase
        .from('photos')
        .select('*')
        .eq('delay_event_id', delay.id)
        .order('taken_at', { ascending: true })
      
      delaysWithDetails.push({
        ...delay,
        weather_events: weatherData?.map(w => ({
          date: format(new Date(w.collected_at), 'yyyy-MM-dd'),
          time: format(new Date(w.collected_at), 'HH:mm'),
          condition: w.conditions,
          value: w.wind_speed || w.precipitation_amount || w.temperature,
          threshold: 0,
          source: `${w.data_source} - Station ${w.station_id}`,
          station_distance: w.station_distance
        })) || [],
        photos: photos?.map(p => ({
          filename: p.filename,
          takenAt: p.taken_at ? format(new Date(p.taken_at), 'yyyy-MM-dd HH:mm') : 'Unknown',
          location: p.latitude && p.longitude 
            ? `${p.latitude.toFixed(6)}, ${p.longitude.toFixed(6)}`
            : 'Not available',
          device: p.device_make && p.device_model
            ? `${p.device_make} ${p.device_model}`
            : 'Unknown device',
          caption: p.caption || ''
        })) || []
      })
    }
    
    // Prepare data for ACORD mapping
    const reportData = {
      reportId: report.id,
      project: {
        name: report.projects.name,
        address: report.projects.address,
        lat: report.projects.latitude,
        lng: report.projects.longitude,
        start_date: report.projects.start_date,
        policy_number: report.policy_number
      },
      company: {
        name: report.projects.users.company || 'Unknown Company',
        contact: report.projects.users.name || 'Unknown',
        email: report.projects.users.email,
        phone: report.projects.users.phone,
        address: report.projects.address // Using project address as company address
      },
      claim_period: {
        start: report.period_start,
        end: report.period_end
      },
      policy: {
        limit: body.policyLimit,
        deductible: body.policyDeductible
      },
      claimNumber: body.claimNumber,
      delays: delaysWithDetails.map(d => ({
        date: format(new Date(d.start_time), 'yyyy-MM-dd'),
        hours_lost: d.duration_hours || d.labor_hours_lost || 0,
        crew_size: d.crew_size || report.projects.crew_size,
        labor_cost: d.labor_cost || 0,
        equipment_cost: d.equipment_cost || 0,
        overhead_cost: d.overhead_cost || 0,
        total_cost: d.total_cost || 0,
        activities_affected: d.affected_activities || [],
        weather_events: d.weather_events,
        photos: d.photos
      })),
      weather_thresholds: report.projects.weather_thresholds,
      summary: {
        total_delay_days: delaysWithDetails.length,
        total_hours_lost: report.total_delay_hours || 0,
        total_labor_cost: delaysWithDetails.reduce((sum, d) => sum + (d.labor_cost || 0), 0),
        total_equipment_cost: delaysWithDetails.reduce((sum, d) => sum + (d.equipment_cost || 0), 0),
        total_overhead_cost: delaysWithDetails.reduce((sum, d) => sum + (d.overhead_cost || 0), 0),
        total_claim_amount: report.total_cost || 0
      },
      signature: report.signed_by ? {
        signedBy: report.projects.users.name,
        signedAt: format(new Date(report.signed_at), 'MMMM dd, yyyy HH:mm'),
        signatureData: report.signature_data,
        affidavitText: report.affidavit_text
      } : undefined
    }
    
    // Generate ACORD data
    const acordData = acordMapper.mapToACORD125(reportData)
    
    if (outputFormat === 'json') {
      // Return ACORD data as JSON
      return NextResponse.json({
        success: true,
        acordData,
        report: {
          id: report.id,
          projectName: report.projects.name,
          claimAmount: report.total_cost
        }
      })
    } else {
      // Generate ACORD XML
      const xml = acordMapper.generateACORDXML(acordData)
      
      // Return XML with proper headers
      return new NextResponse(xml, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml',
          'Content-Disposition': `attachment; filename="ACORD125_${report.id}.xml"`
        }
      })
    }
    
  } catch (error) {
    console.error('ACORD generation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate ACORD report'
      },
      { status: 500 }
    )
  }
}