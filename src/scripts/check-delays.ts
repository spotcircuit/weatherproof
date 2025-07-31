import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkDelays() {
  try {
    // First, let's check the table structure
    const { data: columns, error: schemaError } = await supabase
      .rpc('get_table_columns', { table_name: 'delay_events' })
    
    if (!schemaError && columns) {
      console.log('Delay Events Table Columns:')
      console.log(columns.map((c: any) => c.column_name).join(', '))
      console.log('')
    }
    
    // Get recent delay events
    const { data: delays, error } = await supabase
      .from('delay_events')
      .select(`
        *,
        projects (
          name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) {
      console.error('Error fetching delays:', error)
      return
    }
    
    console.log('\n=== Recent Delay Events ===')
    console.log(`Found ${delays?.length || 0} delays\n`)
    
    if (delays && delays.length > 0) {
      // Show first delay structure
      console.log('Sample delay structure:')
      console.log(JSON.stringify(delays[0], null, 2))
      console.log('\n')
      
      delays.forEach((delay, index) => {
        console.log(`${index + 1}. Project: ${delay.projects?.name || 'Unknown'}`)
        console.log(`   ID: ${delay.id}`)
        console.log(`   Created: ${new Date(delay.created_at).toLocaleString()}`)
        // Show all fields dynamically
        Object.entries(delay).forEach(([key, value]) => {
          if (key !== 'projects' && key !== 'id' && key !== 'created_at' && value !== null) {
            console.log(`   ${key}: ${JSON.stringify(value)}`)
          }
        })
        console.log('')
      })
    } else {
      console.log('No delays found in the database.')
    }
    
    // Get delay counts by project
    const { data: projectCounts, error: countError } = await supabase
      .from('delay_events')
      .select('project_id, projects(name)')
      .order('project_id')
    
    if (!countError && projectCounts) {
      const counts = projectCounts.reduce((acc, delay) => {
        const projectName = delay.projects?.name || 'Unknown'
        acc[projectName] = (acc[projectName] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      console.log('\n=== Delays by Project ===')
      Object.entries(counts).forEach(([project, count]) => {
        console.log(`${project}: ${count} delays`)
      })
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

checkDelays()