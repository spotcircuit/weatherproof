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

async function checkDelayDetails() {
  try {
    // Get the most recent delay
    const { data: delays, error } = await supabase
      .from('delay_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (error || !delays || delays.length === 0) {
      console.error('Error or no delays found:', error)
      return
    }
    
    const delay = delays[0]
    console.log('\n=== Most Recent Delay Details ===')
    console.log('ID:', delay.id)
    console.log('Total Cost:', delay.total_cost)
    console.log('Computed Labor Cost:', delay.computed_labor_cost)
    console.log('Computed Equipment Cost:', delay.computed_equipment_cost)
    console.log('Duration Hours:', delay.duration_hours)
    console.log('Cost Breakdown:', JSON.stringify(delay.cost_breakdown, null, 2))
    
    // Get crew affected
    const { data: crew } = await supabase
      .from('delay_crew_affected')
      .select(`
        *,
        crew_members (
          name,
          role
        )
      `)
      .eq('delay_event_id', delay.id)
    
    console.log('\n=== Affected Crew ===')
    if (crew && crew.length > 0) {
      crew.forEach((c: any) => {
        console.log(`- ${c.crew_members?.name} (${c.crew_members?.role})`)
        console.log(`  Hours: ${c.hours_idled}, Rate: $${c.hourly_rate}/hr, Burden: ${c.burden_rate}`)
        console.log(`  Total Cost: $${c.total_cost}`)
      })
      const totalCrewCost = crew.reduce((sum, c) => sum + c.total_cost, 0)
      console.log(`Total Crew Cost: $${totalCrewCost}`)
    } else {
      console.log('No crew affected recorded')
    }
    
    // Get equipment affected
    const { data: equipment } = await supabase
      .from('delay_equipment_affected')
      .select(`
        *,
        equipment (
          name,
          type
        )
      `)
      .eq('delay_event_id', delay.id)
    
    console.log('\n=== Affected Equipment ===')
    if (equipment && equipment.length > 0) {
      equipment.forEach((e: any) => {
        console.log(`- ${e.equipment?.name} (${e.equipment?.type})`)
        console.log(`  Hours: ${e.hours_idled}, Standby Rate: $${e.standby_rate}/hr`)
        const cost = e.hours_idled * e.standby_rate
        console.log(`  Total Cost: $${cost}`)
      })
      const totalEquipmentCost = equipment.reduce((sum, e) => sum + (e.hours_idled * e.standby_rate), 0)
      console.log(`Total Equipment Cost: $${totalEquipmentCost}`)
    } else {
      console.log('No equipment affected recorded')
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

checkDelayDetails()