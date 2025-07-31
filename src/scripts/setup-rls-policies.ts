import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

// Use service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupRLSPolicies() {
  try {
    console.log('🔧 Setting up RLS policies for all tables...')
    
    // Get demo user for testing
    const { data: userData } = await supabase.auth.admin.listUsers()
    const demoUser = userData?.users.find(u => u.email === 'demo@weatherproof.app')
    
    if (!demoUser) {
      console.error('Demo user not found!')
      return
    }
    
    console.log('Found demo user:', demoUser.id)
    
    // Test creating a project with the demo user's ID
    console.log('\n📝 Testing project creation...')
    const testProject = {
      user_id: demoUser.id,
      name: 'RLS Policy Test',
      address: '123 Test St',
      project_type: 'residential',
      crew_size: 5,
      hourly_rate: 75,
      daily_overhead: 500,
      active: true,
      start_date: new Date().toISOString()
    }
    
    // First, delete any existing test project
    await supabase
      .from('projects')
      .delete()
      .eq('name', 'RLS Policy Test')
    
    // Try to insert
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert(testProject)
      .select()
      .single()
    
    if (projectError) {
      console.error('❌ Cannot create project:', projectError)
      console.log('\n⚠️  RLS is likely blocking writes. This needs to be fixed in Supabase Dashboard.')
    } else {
      console.log('✅ Successfully created test project:', projectData.id)
      
      // Test creating a delay event
      console.log('\n📝 Testing delay event creation...')
      const testDelay = {
        project_id: projectData.id,
        start_time: new Date().toISOString(),
        weather_condition: 'Heavy Rain',
        delay_reason: 'RLS Policy Test',
        crew_size: 5,
        hourly_rate: 75
      }
      
      const { error: delayError } = await supabase
        .from('delay_events')
        .insert(testDelay)
      
      if (delayError) {
        console.error('❌ Cannot create delay event:', delayError)
      } else {
        console.log('✅ Successfully created test delay event')
      }
      
      // Clean up
      await supabase
        .from('projects')
        .delete()
        .eq('id', projectData.id)
    }
    
    console.log('\n📋 RLS Policy Setup Instructions:')
    console.log('=====================================')
    console.log('\nIf writes are failing, you need to update RLS policies in Supabase Dashboard:')
    console.log('\n1. Go to your Supabase Dashboard')
    console.log('2. Navigate to Authentication > Policies')
    console.log('3. For each of these tables, ensure you have INSERT, UPDATE, and DELETE policies:')
    console.log('   - projects')
    console.log('   - delay_events')
    console.log('   - weather_readings')
    console.log('   - crew_members')
    console.log('   - equipment')
    console.log('   - project_crew_assignments')
    console.log('   - project_equipment_assignments')
    console.log('   - reports')
    console.log('   - company_settings')
    console.log('   - weather_threshold_templates')
    
    console.log('\n4. For a quick fix during development:')
    console.log('   a) Go to Table Editor')
    console.log('   b) Click on a table')
    console.log('   c) Click "RLS enabled" to temporarily disable it')
    console.log('   d) Or add these policies:')
    console.log('\n   For tables with user_id (projects, crew_members, equipment):')
    console.log('   - Policy name: "Users can insert own data"')
    console.log('   - Allowed operation: INSERT')
    console.log('   - USING expression: true')
    console.log('   - WITH CHECK expression: auth.uid() = user_id')
    console.log('\n   - Policy name: "Users can update own data"')
    console.log('   - Allowed operation: UPDATE')
    console.log('   - USING expression: auth.uid() = user_id')
    console.log('\n   - Policy name: "Users can delete own data"')
    console.log('   - Allowed operation: DELETE')
    console.log('   - USING expression: auth.uid() = user_id')
    
    console.log('\n   For related tables (delay_events, weather_readings):')
    console.log('   - Similar policies but check: project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())')
    
    console.log('\n5. Alternative: Run this SQL in Supabase SQL Editor:')
    console.log(`
-- Enable INSERT for authenticated users on their own data
CREATE POLICY "Users can insert own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- Similar for other tables...
    `)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    process.exit()
  }
}

setupRLSPolicies()