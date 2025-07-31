import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function assignCrewToMedicalCenter() {
  try {
    // Find Medical Center Expansion project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('name', 'Medical Center Expansion')
      .single()

    if (projectError || !project) {
      console.error('Medical Center Expansion project not found')
      return
    }

    console.log('Found project:', project.name, project.id)

    // Get all crew members
    const { data: crew } = await supabase
      .from('crew_members')
      .select('*')
      .eq('active', true)

    console.log(`Found ${crew?.length || 0} active crew members`)

    // Get all equipment
    const { data: equipment } = await supabase
      .from('equipment')
      .select('*')
      .eq('active', true)

    console.log(`Found ${equipment?.length || 0} active equipment`)

    // Assign crew to Medical Center project
    if (crew && crew.length > 0) {
      const crewAssignments = crew.map(member => ({
        project_id: project.id,
        crew_member_id: member.id,
        start_date: project.start_date || new Date().toISOString()
      }))

      const { error: crewError } = await supabase
        .from('project_crew_assignments')
        .upsert(crewAssignments, { 
          onConflict: 'project_id,crew_member_id',
          ignoreDuplicates: true 
        })

      if (crewError) {
        console.error('Error assigning crew:', crewError)
      } else {
        console.log(`✅ Assigned ${crew.length} crew members to Medical Center Expansion`)
      }
    }

    // Assign equipment to Medical Center project
    if (equipment && equipment.length > 0) {
      const equipmentAssignments = equipment.map(item => ({
        project_id: project.id,
        equipment_id: item.id,
        start_date: project.start_date || new Date().toISOString()
      }))

      const { error: equipError } = await supabase
        .from('project_equipment_assignments')
        .upsert(equipmentAssignments, {
          onConflict: 'project_id,equipment_id',
          ignoreDuplicates: true
        })

      if (equipError) {
        console.error('Error assigning equipment:', equipError)
      } else {
        console.log(`✅ Assigned ${equipment.length} equipment items to Medical Center Expansion`)
      }
    }

    // Verify assignments
    const { count: crewCount } = await supabase
      .from('project_crew_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', project.id)

    const { count: equipCount } = await supabase
      .from('project_equipment_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', project.id)

    console.log(`\nMedical Center Expansion now has:`)
    console.log(`- ${crewCount} crew members`)
    console.log(`- ${equipCount} equipment items`)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    process.exit()
  }
}

assignCrewToMedicalCenter()