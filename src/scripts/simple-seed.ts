// Simple seed script focusing on just creating demo data
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function seed() {
  try {
    console.log('Starting simple seed...')
    
    // Get auth user
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) throw listError
    
    const authUser = users.find((u: any) => u.email === 'demo@weatherproof.app')
    if (!authUser) {
      console.log('Demo user not found in auth. Please create it first.')
      return
    }
    
    console.log('Found auth user:', authUser.id)
    
    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking user:', checkError)
      throw checkError
    }
    
    if (existingUser) {
      console.log('User already exists in users table')
    } else {
      // Create user profile
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: 'demo@weatherproof.app',
          name: 'Demo User',
          company: 'Demo Construction Co',
          phone: '555-0123'
        })
        .select()
        .single()
      
      if (insertError) {
        console.error('Error creating user profile:')
        console.error('Full error:', JSON.stringify(insertError, null, 2))
        throw insertError
      }
      
      console.log('Created user:', newUser)
    }
    
    console.log('Created/updated user profile')
    
    // Create a simple project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: authUser.id,
        name: 'Demo Project - Downtown Office',
        address: '123 Main St, Austin, TX 78701',
        latitude: 30.2672,
        longitude: -97.7431,
        start_date: new Date().toISOString(),
        active: true,
        project_type: 'roofing',
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
    
    if (projectError) {
      console.error('Error creating project:', projectError)
      throw projectError
    }
    
    console.log('Created project:', project.name)
    console.log('\nSeeding complete!')
    console.log('Demo account: demo@weatherproof.app / demo123456')
    
  } catch (error) {
    console.error('Seed error:', error)
  }
}

seed()