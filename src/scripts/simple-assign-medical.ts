import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function assignToMedical() {
  // Get Medical Center project
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('name', 'Medical Center Expansion')
    .single()

  if (!project) {
    console.error('Medical Center Expansion not found')
    return
  }

  // Get all crew
  const { data: crew } = await supabase
    .from('crew_members')
    .select('id')

  // Get all equipment  
  const { data: equipment } = await supabase
    .from('equipment')
    .select('id')

  console.log(`Assigning ${crew?.length} crew and ${equipment?.length} equipment to Medical Center`)

  // Simple insert for crew
  if (crew) {
    for (const member of crew) {
      const { error } = await supabase
        .from('project_crew_assignments')
        .insert({
          project_id: project.id,
          crew_member_id: member.id
        })
      
      if (error && !error.message.includes('duplicate')) {
        console.error('Crew error:', error)
      }
    }
  }

  // Simple insert for equipment
  if (equipment) {
    for (const item of equipment) {
      const { error } = await supabase
        .from('project_equipment_assignments')
        .insert({
          project_id: project.id,
          equipment_id: item.id
        })
      
      if (error && !error.message.includes('duplicate')) {
        console.error('Equipment error:', error)
      }
    }
  }

  console.log('Done!')
}

assignToMedical().then(() => process.exit())