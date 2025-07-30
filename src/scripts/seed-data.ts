// Script to seed database with mock data for testing
// Run with: npm run seed

import { createClient } from '@supabase/supabase-js'
import { addDays, subDays, subHours, addHours } from 'date-fns'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables!')
  console.error('Please ensure .env.local contains:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Sample data generators
const projectNames = [
  'Downtown Office Complex Roofing',
  'Residential Development - Phase 2',
  'Mall Parking Structure Concrete',
  'School Renovation Project',
  'Medical Center Expansion',
  'Warehouse Distribution Center',
  'Luxury Apartments Framing',
  'City Park Pavilion',
  'Hotel Exterior Painting',
  'Shopping Center Reroof'
]

const addresses = [
  { address: '123 Main St, Austin, TX 78701', lat: 30.2672, lng: -97.7431 },
  { address: '456 Oak Ave, Dallas, TX 75201', lat: 32.7767, lng: -96.7970 },
  { address: '789 Elm Dr, Houston, TX 77001', lat: 29.7604, lng: -95.3698 },
  { address: '321 Park Blvd, San Antonio, TX 78201', lat: 29.4241, lng: -98.4936 },
  { address: '654 Commerce St, Fort Worth, TX 76102', lat: 32.7555, lng: -97.3308 },
  { address: '987 Broadway, Austin, TX 78702', lat: 30.2672, lng: -97.7331 },
  { address: '147 Houston St, Dallas, TX 75202', lat: 32.7867, lng: -96.7870 },
  { address: '258 River Rd, Houston, TX 77002', lat: 29.7504, lng: -95.3598 },
  { address: '369 Market St, San Antonio, TX 78202', lat: 29.4141, lng: -98.4836 },
  { address: '741 Lake Dr, Fort Worth, TX 76103', lat: 32.7455, lng: -97.3208 }
]

const weatherConditions = ['Clear', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Heavy Rain', 'Thunderstorms', 'Windy']

async function seedData() {
  try {
    console.log('Starting data seed...')
    
    // Get or create a test user
    let userId: string
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'demo@weatherproof.app')
      .single()
    
    if (existingUser) {
      userId = existingUser.id
      console.log('Using existing demo user')
    } else {
      // Create user in auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: 'demo@weatherproof.app',
        password: 'demo123456',
        email_confirm: true
      })
      
      if (authError) throw authError
      userId = authData.user.id
      
      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: 'demo@weatherproof.app',
          name: 'Demo User',
          company: 'Demo Construction Co',
          phone: '555-0123'
        })
      
      if (profileError) throw profileError
      console.log('Created demo user')
    }
    
    // Create projects
    const projects = []
    for (let i = 0; i < 10; i++) {
      const location = addresses[i]
      const startDate = subDays(new Date(), Math.floor(Math.random() * 60) + 30)
      const projectType = ['roofing', 'concrete', 'framing', 'painting', 'general'][Math.floor(Math.random() * 5)]
      
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          user_id: userId,
          name: projectNames[i],
          address: location.address,
          latitude: location.lat,
          longitude: location.lng,
          start_date: startDate.toISOString(),
          active: Math.random() > 0.2, // 80% active
          project_type: projectType,
          crew_size: Math.floor(Math.random() * 8) + 3,
          hourly_rate: Math.floor(Math.random() * 30) + 40,
          daily_overhead: Math.floor(Math.random() * 500) + 500,
          weather_thresholds: getThresholdsForType(projectType)
        })
        .select()
        .single()
      
      if (error) throw error
      projects.push(project)
      console.log(`Created project: ${project.name}`)
    }
    
    // Create weather readings and delay events
    for (const project of projects) {
      // Generate weather readings for the last 30 days
      const readings = []
      let currentDate = subDays(new Date(), 30)
      
      while (currentDate < new Date()) {
        // Generate 4 readings per day (every 6 hours)
        for (let hour of [6, 12, 18, 0]) {
          const readingTime = new Date(currentDate)
          readingTime.setHours(hour)
          
          const isRainy = Math.random() < 0.15
          const isWindy = Math.random() < 0.1
          const temperature = Math.random() * 40 + 50 // 50-90°F
          const windSpeed = isWindy ? Math.random() * 20 + 25 : Math.random() * 15 + 5
          const precipitation = isRainy ? Math.random() * 1.5 : 0
          
          const reading = {
            project_id: project.id,
            timestamp: readingTime.toISOString(),
            temperature: temperature,
            wind_speed: windSpeed,
            precipitation: precipitation,
            humidity: Math.floor(Math.random() * 40) + 40,
            pressure: 29.92 + (Math.random() * 0.5 - 0.25),
            visibility: isRainy ? Math.random() * 5 + 2 : 10,
            conditions: isRainy ? 'Rain' : isWindy ? 'Windy' : weatherConditions[Math.floor(Math.random() * 3)],
            source: 'noaa',
            station_id: 'KAUS',
            station_distance: Math.random() * 5 + 1,
            raw_data: {
              station: 'KAUS',
              observation_time: readingTime.toISOString(),
              weather: isRainy ? 'rain' : 'clear',
              temp_f: temperature,
              wind_mph: windSpeed,
              wind_dir: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
              pressure_in: 29.92 + (Math.random() * 0.5 - 0.25),
              dewpoint_f: temperature - 10,
              heat_index_f: temperature > 80 ? temperature + 5 : null
            }
          }
          
          readings.push(reading)
          
          // Check if this triggers a delay
          const violations = checkThresholds(reading, project.weather_thresholds)
          if (violations.length > 0 && Math.random() < 0.7) { // 70% chance to create delay
            const delayDuration = Math.random() * 6 + 2 // 2-8 hours
            const laborCost = project.crew_size * project.hourly_rate * delayDuration
            const overheadCost = (delayDuration / 8) * project.daily_overhead
            
            await supabase.from('delay_events').insert({
              project_id: project.id,
              start_time: readingTime.toISOString(),
              end_time: addHours(readingTime, delayDuration).toISOString(),
              duration_hours: delayDuration,
              weather_condition: violations.join(', '),
              threshold_violated: { violations },
              affected_activities: getAffectedActivities(project.project_type, violations),
              crew_size: project.crew_size,
              labor_hours_lost: delayDuration,
              labor_cost: laborCost,
              equipment_cost: Math.random() * 500,
              overhead_cost: overheadCost,
              total_cost: laborCost + overheadCost + (Math.random() * 500),
              auto_generated: true,
              verified: Math.random() > 0.5
            })
          }
        }
        
        currentDate = addDays(currentDate, 1)
      }
      
      // Bulk insert weather readings
      const { error: weatherError } = await supabase
        .from('weather_readings')
        .insert(readings)
      
      if (weatherError) throw weatherError
      console.log(`Created ${readings.length} weather readings for ${project.name}`)
    }
    
    // Create some alerts
    const alertTypes = ['WEATHER_WARNING', 'DELAY_DETECTED', 'THRESHOLD_APPROACHING']
    const severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    
    for (const project of projects.slice(0, 5)) {
      const { error } = await supabase
        .from('alerts')
        .insert({
          project_id: project.id,
          user_id: userId,
          type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
          severity: severities[Math.floor(Math.random() * severities.length)],
          message: `Weather conditions approaching thresholds at ${project.name}`,
          weather_data: {
            temperature: 95,
            wind_speed: 28,
            precipitation: 0.2
          },
          read: Math.random() > 0.7
        })
      
      if (error) throw error
    }
    
    // Create photos for delay events
    const delayEventsWithPhotos = await supabase
      .from('delay_events')
      .select('id, project_id')
      .in('project_id', projects.map(p => p.id))
      .limit(20)
    
    if (delayEventsWithPhotos.data) {
      for (const delay of delayEventsWithPhotos.data.slice(0, 10)) {
        // Get project details for location
        const project = projects.find(p => p.id === delay.project_id)
        if (!project) continue
        
        // Create 2-3 photos per delay event
        const photoCount = Math.floor(Math.random() * 2) + 2
        for (let i = 0; i < photoCount; i++) {
          const photoTime = subHours(new Date(), Math.floor(Math.random() * 48))
          await supabase.from('photos').insert({
            delay_event_id: delay.id,
            project_id: delay.project_id,
            user_id: userId,
            file_url: `https://placeholder.photos/weather-delay-${delay.id}-${i}.jpg`,
            file_name: `weather-delay-${delay.id}-${i}.jpg`,
            file_size: Math.floor(Math.random() * 5000000) + 1000000, // 1-6MB
            mime_type: 'image/jpeg',
            metadata: {
              gps_latitude: project.latitude + (Math.random() * 0.001 - 0.0005),
              gps_longitude: project.longitude + (Math.random() * 0.001 - 0.0005),
              taken_at: photoTime.toISOString(),
              device_make: ['Apple', 'Samsung', 'Google'][Math.floor(Math.random() * 3)],
              device_model: ['iPhone 14 Pro', 'Galaxy S23 Ultra', 'Pixel 7 Pro'][Math.floor(Math.random() * 3)],
              description: ['Standing water on site', 'High winds affecting crane operations', 'Ice formation on construction materials', 'Heavy rain causing work stoppage'][Math.floor(Math.random() * 4)]
            },
            uploaded_at: photoTime.toISOString()
          })
        }
      }
      console.log('Created photos for delay events')
    }

    // Create some reports with comprehensive data
    for (const project of projects.slice(0, 3)) {
      // Get delay events for this project
      const { data: projectDelays } = await supabase
        .from('delay_events')
        .select('*')
        .eq('project_id', project.id)
        .gte('start_time', subDays(new Date(), 30).toISOString())
      
      const totalHours = projectDelays?.reduce((sum, d) => sum + (d.labor_hours_lost || 0), 0) || 0
      const totalCost = projectDelays?.reduce((sum, d) => sum + (d.total_cost || 0), 0) || 0
      
      const reportData = {
        project_id: project.id,
        user_id: userId,
        report_type: 'INSURANCE_CLAIM' as const,
        period_start: subDays(new Date(), 30).toISOString(),
        period_end: new Date().toISOString(),
        total_delay_hours: totalHours,
        total_cost: totalCost,
        status: 'COMPLETED' as const,
        document_url: `https://placeholder.reports/report-${project.id}.pdf`,
        policy_number: `POL-${Math.floor(Math.random() * 900000) + 100000}`,
        insurer_name: ['Travelers', 'Liberty Mutual', 'State Farm', 'Nationwide'][Math.floor(Math.random() * 4)],
        claim_amount: totalCost * 1.1, // Add 10% for additional costs
        metadata: {
          delays_count: projectDelays?.length || 0,
          weather_events: projectDelays?.map(d => d.weather_condition) || [],
          report_generated_by: 'Demo User',
          includes_photos: true,
          digital_signature: {
            signer_name: 'Demo User',
            signer_title: 'Project Manager',
            signed_at: new Date().toISOString(),
            ip_address: '192.168.1.1',
            signature_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
          },
          acord_form: {
            form_type: 'ACORD_125',
            version: '2016/03',
            transaction_id: `WP-${Date.now()}`,
            claim_number: `CLM-${Math.floor(Math.random() * 900000) + 100000}`,
            generated_at: new Date().toISOString()
          }
        }
      }
      
      const { data: report, error } = await supabase
        .from('reports')
        .insert(reportData)
        .select()
        .single()
      
      if (error) throw error
      console.log(`Created comprehensive report for ${project.name}`)
    }
    
    // Create webhook logs for n8n integration
    const recentAlerts = await supabase
      .from('alerts')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (recentAlerts.data) {
      for (const alert of recentAlerts.data) {
        await supabase.from('webhook_logs').insert({
          alert_id: alert.id,
          webhook_url: process.env.N8N_WEBHOOK_URL || 'https://n8n.example.com/webhook/weatherproof',
          payload: {
            event: 'weather.alert',
            alert_id: alert.id,
            timestamp: new Date().toISOString()
          },
          response_status: 200,
          response_body: { success: true, workflow_id: 'wf_' + Math.random().toString(36).substr(2, 9) }
        })
      }
      console.log('Created webhook logs for n8n integration')
    }

    // Create import logs
    await supabase.from('import_logs').insert([
      {
        user_id: userId,
        import_type: 'csv',
        file_name: 'projects_january_2024.csv',
        total_rows: 150,
        successful_rows: 147,
        failed_rows: 3,
        errors: [
          { row: 45, error: 'Invalid date format' },
          { row: 89, error: 'Missing required field: address' },
          { row: 123, error: 'Duplicate project name' }
        ],
        created_at: subDays(new Date(), 5).toISOString()
      },
      {
        user_id: userId,
        import_type: 'servicetitan',
        total_rows: 85,
        successful_rows: 85,
        failed_rows: 0,
        errors: [],
        created_at: subDays(new Date(), 2).toISOString()
      }
    ])
    console.log('Created import logs')

    // Create some active delays for dashboard
    const activeProject = projects[0]
    await supabase.from('delay_events').insert({
      project_id: activeProject.id,
      start_time: subHours(new Date(), 2).toISOString(),
      end_time: null, // Active delay
      weather_condition: 'Heavy Rain - 1.5 inches/hour',
      threshold_violated: { precipitation: 1.5 },
      affected_activities: ['concrete pouring', 'exterior work'],
      crew_size: activeProject.crew_size,
      auto_generated: true,
      verified: false,
      notes: 'Monitoring conditions. Work suspended until precipitation drops below threshold.'
    })
    console.log('Created active delay event')

    console.log('✅ Data seeding completed successfully!')
    console.log(`
    Demo Account Credentials:
    Email: demo@weatherproof.app
    Password: demo123456
    
    Features Seeded:
    - 10 Projects with realistic construction data
    - 30 days of weather readings (4x daily)
    - Multiple delay events with cost calculations
    - Photos with EXIF metadata for delays
    - Insurance reports with digital signatures
    - ACORD form metadata
    - Weather alerts (various severities)
    - n8n webhook logs
    - Import history logs
    - 1 Active delay for real-time monitoring
    `)
    
  } catch (error) {
    console.error('Error seeding data:', error)
  }
}

function getThresholdsForType(type: string) {
  const thresholds: any = {
    roofing: {
      wind_speed: 25,
      precipitation: 0.1,
      temperature_min: 40,
      temperature_max: 95
    },
    concrete: {
      wind_speed: 30,
      precipitation: 0.25,
      temperature_min: 40,
      temperature_max: 90
    },
    framing: {
      wind_speed: 35,
      precipitation: 0.5,
      temperature_min: 20,
      temperature_max: 100
    },
    painting: {
      wind_speed: 20,
      precipitation: 0,
      temperature_min: 50,
      temperature_max: 90,
      humidity_max: 85
    },
    general: {
      wind_speed: 40,
      precipitation: 0.5,
      temperature_min: 20,
      temperature_max: 100
    }
  }
  
  return thresholds[type] || thresholds.general
}

function checkThresholds(weather: any, thresholds: any) {
  const violations = []
  
  if (weather.wind_speed > thresholds.wind_speed) {
    violations.push('High Wind')
  }
  if (weather.precipitation > thresholds.precipitation) {
    violations.push('Precipitation')
  }
  if (weather.temperature < thresholds.temperature_min) {
    violations.push('Low Temperature')
  }
  if (weather.temperature > thresholds.temperature_max) {
    violations.push('High Temperature')
  }
  
  return violations
}

function getAffectedActivities(projectType: string, violations: string[]) {
  const activities: any = {
    roofing: ['shingle installation', 'underlayment', 'flashing'],
    concrete: ['pouring', 'finishing', 'curing'],
    framing: ['wall erection', 'roof framing', 'sheathing'],
    painting: ['surface prep', 'primer application', 'finish coating'],
    general: ['outdoor work', 'material handling', 'equipment operation']
  }
  
  return activities[projectType] || activities.general
}

// Run the seed
seedData()