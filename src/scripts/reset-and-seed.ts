// Script to clean and seed database with mock data for testing
// Run with: npm run seed

import { createClient } from '@supabase/supabase-js'
import { addDays } from 'date-fns/addDays'
import { subDays } from 'date-fns/subDays'
import { subHours } from 'date-fns/subHours'
import { addHours } from 'date-fns/addHours'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

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

async function cleanDatabase() {
  console.log('Cleaning existing data...')
  
  // Delete in order due to foreign key constraints
  await supabase.from('webhook_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('import_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('photos').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('reports').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('alerts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('delay_events').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('weather_readings').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  
  console.log('Database cleaned')
}

async function seedData() {
  try {
    console.log('Starting data seed...')
    
    // Clean first
    await cleanDatabase()
    
    // Get or create a test user
    let userId: string
    
    // First check if user exists in users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'demo@weatherproof.app')
      .single()
    
    if (existingUser) {
      userId = existingUser.id
      console.log('Using existing demo user from users table')
    } else {
      // Try to create user in auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: 'demo@weatherproof.app',
        password: 'demo123456',
        email_confirm: true
      })
      
      if (authError && !authError.message?.includes('already')) {
        throw authError
      }
      
      // If user already exists in auth, get their ID
      if (!authData) {
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
        if (listError) throw listError
        
        const authUser = users.find((u: any) => u.email === 'demo@weatherproof.app')
        if (!authUser) throw new Error('Could not find or create auth user')
        
        userId = authUser.id
        console.log('Found existing auth user')
      } else {
        userId = authData.user!.id
        console.log('Created new auth user')
      }
      
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
      
      if (profileError && !profileError.message?.includes('duplicate')) {
        throw profileError
      }
      console.log('Created user profile')
    }
    
    // Create projects
    const projects = []
    const projectNames = [
      'Downtown Office Complex Roofing',
      'Residential Development - Phase 2',
      'Mall Parking Structure Concrete',
      'School Renovation Project',
      'Medical Center Expansion'
    ]
    
    const addresses = [
      { address: '123 Main St, Austin, TX 78701', lat: 30.2672, lng: -97.7431 },
      { address: '456 Oak Ave, Dallas, TX 75201', lat: 32.7767, lng: -96.7970 },
      { address: '789 Elm Dr, Houston, TX 77001', lat: 29.7604, lng: -95.3698 },
      { address: '321 Park Blvd, San Antonio, TX 78201', lat: 29.4241, lng: -98.4936 },
      { address: '654 Commerce St, Fort Worth, TX 76102', lat: 32.7555, lng: -97.3308 }
    ]
    
    for (let i = 0; i < 5; i++) {
      const location = addresses[i]
      const startDate = subDays(new Date(), Math.floor(Math.random() * 30) + 10)
      const projectType = ['roofing', 'concrete', 'framing', 'painting', 'general'][i]
      
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          user_id: userId,
          name: projectNames[i],
          address: location.address,
          latitude: location.lat,
          longitude: location.lng,
          start_date: startDate.toISOString(),
          active: true,
          project_type: projectType,
          crew_size: 8,
          hourly_rate: 65,
          daily_overhead: 1200,
          weather_thresholds: {
            wind_speed: 25,
            precipitation: 0.25,
            temperature_min: 40,
            temperature_max: 90
          }
        })
        .select()
        .single()
      
      if (error) {
        console.error('Error creating project:', error)
        throw error
      }
      projects.push(project)
      console.log(`Created project: ${project.name}`)
    }
    
    // Create weather readings, delays, and alerts for each project
    for (const project of projects) {
      // Create weather readings for the past 7 days
      const weatherReadings = []
      for (let i = 0; i < 7; i++) {
        const date = subDays(new Date(), i)
        const hasDelay = Math.random() > 0.6 // 40% chance of delay conditions
        
        const { data: reading } = await supabase
          .from('weather_readings')
          .insert({
            project_id: project.id,
            timestamp: date.toISOString(),
            temperature: 40 + Math.random() * 60, // 40-100°F
            wind_speed: hasDelay ? 25 + Math.random() * 20 : Math.random() * 20, // High wind if delay
            precipitation: hasDelay ? 0.25 + Math.random() * 2 : 0, // Rain if delay
            conditions: hasDelay ? ['Heavy Rain', 'Thunderstorm', 'High Winds'][Math.floor(Math.random() * 3)] : 'Clear',
            source: 'NOAA',
            station_id: 'KAUS' + Math.floor(Math.random() * 10),
            station_distance: 2 + Math.random() * 10
          })
          .select()
          .single()
        
        if (reading) weatherReadings.push(reading)
      }
      
      // Create delay events based on weather
      const delayReadings = weatherReadings.filter(w => w.wind_speed > 25 || w.precipitation > 0.25)
      
      for (const reading of delayReadings) {
        const delayHours = 4 + Math.floor(Math.random() * 8) // 4-12 hour delays
        const startTime = new Date(reading.timestamp)
        const endTime = addHours(startTime, delayHours)
        
        const { data: delay } = await supabase
          .from('delay_events')
          .insert({
            project_id: project.id,
            start_time: startTime.toISOString(),
            end_time: Math.random() > 0.3 ? endTime.toISOString() : null, // 30% still active
            weather_event_type: reading.precipitation > 0 ? 'rain' : 'wind',
            delay_type: 'weather',
            crew_size: project.crew_size,
            hourly_rate: project.hourly_rate,
            labor_hours_lost: delayHours * project.crew_size,
            labor_cost: delayHours * project.crew_size * project.hourly_rate,
            equipment_cost: delayHours * 150 * Math.random(), // Random equipment cost
            overhead_cost: delayHours * project.daily_overhead / 8,
            total_cost: delayHours * project.crew_size * project.hourly_rate + 
                       delayHours * 150 * Math.random() + 
                       delayHours * project.daily_overhead / 8,
            affected_activities: ['Foundation Work', 'Roofing', 'Concrete Pour', 'Framing'][Math.floor(Math.random() * 4)],
            notes: `Work stopped due to ${reading.conditions}. Wind speed: ${reading.wind_speed.toFixed(0)}mph, Precipitation: ${reading.precipitation.toFixed(2)}"`
          })
          .select()
          .single()
        
        // Create alert for the delay
        if (delay && !delay.end_time) {
          await supabase
            .from('alerts')
            .insert({
              user_id: userId,
              project_id: project.id,
              delay_event_id: delay.id,
              severity: reading.wind_speed > 35 || reading.precipitation > 1 ? 'CRITICAL' : 'HIGH',
              message: `Active weather delay at ${project.name} - ${reading.conditions}`,
              alert_type: 'DELAY_START',
              read: false
            })
        }
      }
      
      console.log(`Created ${delayReadings.length} delays for ${project.name}`)
    }
    
    // Create some sample reports
    for (const project of projects.slice(0, 2)) { // Create reports for first 2 projects
      const { data: report } = await supabase
        .from('reports')
        .insert({
          user_id: userId,
          project_id: project.id,
          period_start: subDays(new Date(), 30).toISOString(),
          period_end: new Date().toISOString(),
          total_delay_days: 5 + Math.floor(Math.random() * 10),
          total_delay_hours: 40 + Math.floor(Math.random() * 80),
          total_cost: 15000 + Math.floor(Math.random() * 35000),
          signed_by: Math.random() > 0.5 ? 'John Smith' : null,
          signed_at: Math.random() > 0.5 ? subDays(new Date(), 2).toISOString() : null,
          policy_number: 'POL-2024-' + Math.floor(Math.random() * 10000)
        })
        .select()
        .single()
      
      console.log(`Created report for ${project.name}`)
    }
    
    console.log('✅ Data seeding completed successfully!')
    console.log(`
    Demo Account Credentials:
    Email: demo@weatherproof.app
    Password: demo123456
    
    Created:
    - 5 Projects with construction data
    - Weather readings for past 7 days
    - Delay events with cost calculations
    - Active alerts for ongoing delays
    - Sample reports (some signed)
    `)
    
  } catch (error) {
    console.error('Error seeding data:')
    if (error instanceof Error) {
      console.error('Message:', error.message)
      console.error('Stack:', error.stack)
    } else {
      console.error('Unknown error:', JSON.stringify(error, null, 2))
    }
    process.exit(1)
  }
}

// Run the seed
seedData()