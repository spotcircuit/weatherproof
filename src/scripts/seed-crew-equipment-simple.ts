import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedCrewAndEquipment() {
  try {
    console.log('Starting crew and equipment seeding...')

    // Get the first user to use as owner
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1)

    if (userError || !users?.[0]) {
      console.error('No users found. Please create a user first.')
      return
    }

    const userId = users[0].id
    console.log('Using user ID:', userId)

    // Simple crew members
    const crewMembers = [
      { name: 'John Martinez', role: 'Site Foreman', hourly_rate: 65, phone: '555-0101' },
      { name: 'Mike Johnson', role: 'Concrete Foreman', hourly_rate: 55, phone: '555-0102' },
      { name: 'Carlos Rodriguez', role: 'Carpenter Lead', hourly_rate: 48, phone: '555-0103' },
      { name: 'Tom Wilson', role: 'Carpenter', hourly_rate: 42, phone: '555-0104' },
      { name: 'Steve Anderson', role: 'Laborer', hourly_rate: 28, phone: '555-0106' }
    ]

    // Simple equipment
    const equipment = [
      { name: 'CAT 336 Excavator', type: 'Excavator', daily_rate: 1200, is_rented: false },
      { name: 'Grove Crane', type: 'Mobile Crane', daily_rate: 2500, is_rented: true },
      { name: 'Bobcat S650', type: 'Skid Steer', daily_rate: 400, is_rented: false },
      { name: 'JLG Boom Lift', type: 'Boom Lift', daily_rate: 800, is_rented: true },
      { name: 'Dump Truck #1', type: 'Dump Truck', daily_rate: 700, is_rented: false }
    ]

    // Insert crew
    console.log('Creating crew members...')
    const { data: createdCrew, error: crewError } = await supabase
      .from('crew_members')
      .insert(crewMembers.map(member => ({
        user_id: userId,
        name: member.name,
        role: member.role,
        hourly_rate: member.hourly_rate,
        phone: member.phone,
        email: `${member.name.toLowerCase().replace(' ', '.')}@construction.com`,
        active: true,
        burden_rate: 1.35,
        emergency_contact: 'Office',
        emergency_phone: '555-0000'
      })))
      .select()

    if (crewError) {
      console.error('Error creating crew:', crewError)
    } else {
      console.log(`Created ${createdCrew.length} crew members`)
    }

    // Insert equipment
    console.log('Creating equipment...')
    const { data: createdEquipment, error: equipError } = await supabase
      .from('equipment')
      .insert(equipment.map(item => ({
        user_id: userId,
        name: item.name,
        type: item.type,
        daily_rate: item.daily_rate,
        hourly_rate: item.daily_rate / 8,
        active: true,
        is_rented: item.is_rented,
        rental_company: item.is_rented ? 'United Rentals' : null,
        description: `${item.type} for construction`,
        serial_number: `SN-${Math.floor(Math.random() * 10000)}`
      })))
      .select()

    if (equipError) {
      console.error('Error creating equipment:', equipError)
    } else {
      console.log(`Created ${createdEquipment.length} equipment items`)
    }

    // Assign to projects
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name')

    if (projects && createdCrew && createdEquipment) {
      for (const project of projects) {
        console.log(`\nAssigning to project: ${project.name}`)
        
        // Assign all crew to each project
        await supabase
          .from('project_crew_assignments')
          .insert(createdCrew.map(crew => ({
            project_id: project.id,
            crew_member_id: crew.id,
            is_active: true
          })))

        // Assign all equipment to each project  
        await supabase
          .from('project_equipment_assignments')
          .insert(createdEquipment.map(equip => ({
            project_id: project.id,
            equipment_id: equip.id,
            is_active: true
          })))
      }
    }

    console.log('\n✅ Done!')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    process.exit()
  }
}

seedCrewAndEquipment()