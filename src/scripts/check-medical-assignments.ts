import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkMedicalAssignments() {
  // Get Medical Center project
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('name', 'Medical Center Expansion')
    .single()

  if (!project) {
    console.error('Medical Center Expansion project not found')
    return
  }

  console.log('Medical Center Project:', project.id, project.name)

  // Check crew assignments
  const { data: crewAssignments, count: crewCount } = await supabase
    .from('project_crew_assignments')
    .select(`
      *,
      crew_members (
        id,
        name,
        role,
        hourly_rate
      )
    `, { count: 'exact' })
    .eq('project_id', project.id)

  console.log('\nCrew assignments:', crewCount)
  if (crewAssignments && crewAssignments.length > 0) {
    crewAssignments.forEach(a => {
      console.log('-', a.crew_members?.name, a.crew_members?.role, `$${a.crew_members?.hourly_rate}/hr`)
    })
  }

  // Check equipment assignments
  const { data: equipmentAssignments, count: equipCount } = await supabase
    .from('project_equipment_assignments')
    .select(`
      *,
      equipment (
        id,
        name,
        type,
        daily_rate,
        standby_rate
      )
    `, { count: 'exact' })
    .eq('project_id', project.id)

  console.log('\nEquipment assignments:', equipCount)
  if (equipmentAssignments && equipmentAssignments.length > 0) {
    equipmentAssignments.forEach(a => {
      console.log('-', a.equipment?.name, a.equipment?.type, `$${a.equipment?.daily_rate}/day`)
    })
  }

  // Check if tables exist
  const { data: crewTable, error: crewError } = await supabase
    .from('crew_members')
    .select('*')
    .limit(1)

  if (crewError) {
    console.error('\nCrew members table error:', crewError.message)
  } else {
    const { count } = await supabase
      .from('crew_members')
      .select('*', { count: 'exact', head: true })
    console.log('\nTotal crew members in database:', count)
  }

  const { data: equipTable, error: equipError } = await supabase
    .from('equipment')
    .select('*')
    .limit(1)

  if (equipError) {
    console.error('\nEquipment table error:', equipError.message)
  } else {
    const { count } = await supabase
      .from('equipment')
      .select('*', { count: 'exact', head: true })
    console.log('Total equipment in database:', count)
  }
}

checkMedicalAssignments().then(() => process.exit())