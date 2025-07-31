import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env file
dotenv.config({ path: resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Sample crew members with realistic roles and rates
const crewMembers = [
  { name: 'John Martinez', role: 'Site Foreman', hourly_rate: 65, phone: '555-0101', email: 'john.m@construction.com' },
  { name: 'Mike Johnson', role: 'Concrete Foreman', hourly_rate: 55, phone: '555-0102', email: 'mike.j@construction.com' },
  { name: 'Carlos Rodriguez', role: 'Carpenter Lead', hourly_rate: 48, phone: '555-0103', email: 'carlos.r@construction.com' },
  { name: 'Tom Wilson', role: 'Senior Carpenter', hourly_rate: 42, phone: '555-0104', email: 'tom.w@construction.com' },
  { name: 'Dave Thompson', role: 'Carpenter', hourly_rate: 38, phone: '555-0105', email: 'dave.t@construction.com' },
  { name: 'Steve Anderson', role: 'Apprentice Carpenter', hourly_rate: 28, phone: '555-0106', email: 'steve.a@construction.com' },
  { name: 'Robert Garcia', role: 'Heavy Equipment Operator', hourly_rate: 52, phone: '555-0107', email: 'robert.g@construction.com' },
  { name: 'James Miller', role: 'Crane Operator', hourly_rate: 58, phone: '555-0108', email: 'james.m@construction.com' },
  { name: 'Frank Davis', role: 'Excavator Operator', hourly_rate: 48, phone: '555-0109', email: 'frank.d@construction.com' },
  { name: 'Bill Brown', role: 'Electrician Lead', hourly_rate: 55, phone: '555-0110', email: 'bill.b@construction.com' },
  { name: 'Joe Taylor', role: 'Journeyman Electrician', hourly_rate: 45, phone: '555-0111', email: 'joe.t@construction.com' },
  { name: 'Pete Williams', role: 'Plumber Lead', hourly_rate: 54, phone: '555-0112', email: 'pete.w@construction.com' },
  { name: 'Mark Jones', role: 'Plumber', hourly_rate: 42, phone: '555-0113', email: 'mark.j@construction.com' },
  { name: 'Luis Hernandez', role: 'Mason Foreman', hourly_rate: 50, phone: '555-0114', email: 'luis.h@construction.com' },
  { name: 'Juan Martinez', role: 'Mason', hourly_rate: 40, phone: '555-0115', email: 'juan.m@construction.com' },
  { name: 'Miguel Lopez', role: 'Laborer', hourly_rate: 25, phone: '555-0116', email: 'miguel.l@construction.com' },
  { name: 'Antonio Gonzalez', role: 'Laborer', hourly_rate: 25, phone: '555-0117', email: 'antonio.g@construction.com' },
  { name: 'Chris Evans', role: 'Roofer Lead', hourly_rate: 46, phone: '555-0118', email: 'chris.e@construction.com' },
  { name: 'Paul Martin', role: 'Roofer', hourly_rate: 38, phone: '555-0119', email: 'paul.m@construction.com' },
  { name: 'Kevin White', role: 'Safety Manager', hourly_rate: 60, phone: '555-0120', email: 'kevin.w@construction.com' }
]

// Sample equipment with realistic rates and ownership status
const equipment = [
  { name: 'CAT 336 Excavator', type: 'Excavator', ownership_type: 'Leased', daily_rate: 1200, weekly_rate: 5000, monthly_rate: 15000, standby_rate: 150 },
  { name: 'John Deere 310L Backhoe', type: 'Backhoe', ownership_type: 'Owned', daily_rate: 600, weekly_rate: 2500, monthly_rate: 7500, standby_rate: 75 },
  { name: 'Grove GMK5275 Crane', type: 'Mobile Crane', ownership_type: 'Rented', daily_rate: 2500, weekly_rate: 10000, monthly_rate: 30000, standby_rate: 300 },
  { name: 'Liebherr Tower Crane', type: 'Tower Crane', ownership_type: 'Rented', daily_rate: 3000, weekly_rate: 12000, monthly_rate: 36000, standby_rate: 375 },
  { name: 'CAT D8T Bulldozer', type: 'Bulldozer', ownership_type: 'Leased', daily_rate: 1500, weekly_rate: 6000, monthly_rate: 18000, standby_rate: 180 },
  { name: 'Bobcat S650 Skid Steer', type: 'Skid Steer', ownership_type: 'Owned', daily_rate: 400, weekly_rate: 1600, monthly_rate: 4800, standby_rate: 50 },
  { name: 'JLG 1850SJ Boom Lift', type: 'Boom Lift', ownership_type: 'Rented', daily_rate: 800, weekly_rate: 3200, monthly_rate: 9600, standby_rate: 100 },
  { name: 'Genie GS-3232 Scissor Lift', type: 'Scissor Lift', ownership_type: 'Rented', daily_rate: 300, weekly_rate: 1200, monthly_rate: 3600, standby_rate: 40 },
  { name: 'CAT 966M Wheel Loader', type: 'Loader', ownership_type: 'Leased', daily_rate: 900, weekly_rate: 3600, monthly_rate: 10800, standby_rate: 110 },
  { name: 'Mack Granite Dump Truck', type: 'Dump Truck', ownership_type: 'Owned', daily_rate: 700, weekly_rate: 2800, monthly_rate: 8400, standby_rate: 85 },
  { name: 'Peterbilt Concrete Truck', type: 'Concrete Mixer', ownership_type: 'Leased', daily_rate: 800, weekly_rate: 3200, monthly_rate: 9600, standby_rate: 100 },
  { name: 'CAT 420F2 Backhoe', type: 'Backhoe', ownership_type: 'Owned', daily_rate: 650, weekly_rate: 2600, monthly_rate: 7800, standby_rate: 80 },
  { name: 'Wacker Neuson DPU6555', type: 'Plate Compactor', ownership_type: 'Owned', daily_rate: 150, weekly_rate: 600, monthly_rate: 1800, standby_rate: 20 },
  { name: 'CAT CB54B Roller', type: 'Compactor', ownership_type: 'Rented', daily_rate: 500, weekly_rate: 2000, monthly_rate: 6000, standby_rate: 60 },
  { name: 'Miller Big Blue 500', type: 'Welder/Generator', ownership_type: 'Owned', daily_rate: 200, weekly_rate: 800, monthly_rate: 2400, standby_rate: 25 },
  { name: 'Atlas Copco XAS 185', type: 'Air Compressor', ownership_type: 'Rented', daily_rate: 250, weekly_rate: 1000, monthly_rate: 3000, standby_rate: 30 },
  { name: 'Multiquip DCA150', type: 'Generator', ownership_type: 'Rented', daily_rate: 300, weekly_rate: 1200, monthly_rate: 3600, standby_rate: 35 },
  { name: 'Husqvarna FS 500', type: 'Concrete Saw', ownership_type: 'Owned', daily_rate: 180, weekly_rate: 720, monthly_rate: 2160, standby_rate: 22 },
  { name: 'Putzmeister Concrete Pump', type: 'Concrete Pump', ownership_type: 'Rented', daily_rate: 1800, weekly_rate: 7200, monthly_rate: 21600, standby_rate: 225 },
  { name: 'JCB 3CX Backhoe', type: 'Backhoe', ownership_type: 'Leased', daily_rate: 600, weekly_rate: 2400, monthly_rate: 7200, standby_rate: 75 }
]

async function seedCrewAndEquipment() {
  try {
    console.log('Starting crew and equipment seeding...')

    // First, create all crew members
    console.log('Creating crew members...')
    const { data: createdCrew, error: crewError } = await supabase
      .from('crew_members')
      .insert(crewMembers.map(member => ({
        ...member,
        active: true,
        burden_rate: 1.35,
        trade: member.role.includes('Carpenter') ? 'Carpentry' : 
               member.role.includes('Electrician') ? 'Electrical' :
               member.role.includes('Plumber') ? 'Plumbing' :
               member.role.includes('Mason') ? 'Masonry' :
               member.role.includes('Roofer') ? 'Roofing' : 'General',
        certifications: member.role.includes('Foreman') ? ['OSHA 30', 'First Aid'] : ['OSHA 10'],
        emergency_contact: 'Emergency Contact',
        emergency_phone: '555-9999',
        created_at: new Date().toISOString()
      })))
      .select()

    if (crewError) {
      console.error('Error creating crew:', crewError)
      return
    }

    console.log(`Created ${createdCrew.length} crew members`)

    // Create all equipment
    console.log('Creating equipment...')
    const { data: createdEquipment, error: equipmentError } = await supabase
      .from('equipment')
      .insert(equipment.map(item => ({
        name: item.name,
        type: item.type,
        daily_rate: item.daily_rate,
        hourly_rate: item.daily_rate / 8,
        standby_rate: item.standby_rate,
        active: true,
        burden_rate: 1,
        is_rented: item.ownership_type === 'Rented',
        rental_company: item.ownership_type === 'Rented' ? 'United Rentals' : 
                       item.ownership_type === 'Leased' ? 'CAT Financial' : null,
        description: `${item.type} - ${item.ownership_type}`,
        serial_number: `${item.name.replace(/[^A-Z0-9]/gi, '').substring(0, 10)}-${Math.floor(Math.random() * 10000)}`,
        purchase_date: item.ownership_type === 'Owned' ? new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString() : null,
        created_at: new Date().toISOString()
      })))
      .select()

    if (equipmentError) {
      console.error('Error creating equipment:', equipmentError)
      return
    }

    console.log(`Created ${createdEquipment.length} equipment items`)

    // Get all projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')

    if (projectsError || !projects) {
      console.error('Error fetching projects:', projectsError)
      return
    }

    console.log(`Found ${projects.length} projects`)

    // Assign crew and equipment to each project
    for (const project of projects) {
      console.log(`\nAssigning resources to project: ${project.name}`)

      // Randomly select 5-15 crew members for this project
      const numCrew = Math.floor(Math.random() * 11) + 5 // 5 to 15
      const shuffledCrew = [...createdCrew].sort(() => 0.5 - Math.random())
      const selectedCrew = shuffledCrew.slice(0, numCrew)

      // Create crew assignments
      const crewAssignments = selectedCrew.map(crew => ({
        project_id: project.id,
        crew_member_id: crew.id,
        start_date: project.start_date || new Date().toISOString(),
        is_active: true,
        created_at: new Date().toISOString()
      }))

      const { error: crewAssignError } = await supabase
        .from('project_crew_assignments')
        .insert(crewAssignments)

      if (crewAssignError) {
        console.error(`Error assigning crew to project ${project.name}:`, crewAssignError)
      } else {
        console.log(`  - Assigned ${selectedCrew.length} crew members`)
      }

      // Randomly select 3-10 equipment items for this project
      const numEquipment = Math.floor(Math.random() * 8) + 3 // 3 to 10
      const shuffledEquipment = [...createdEquipment].sort(() => 0.5 - Math.random())
      const selectedEquipment = shuffledEquipment.slice(0, numEquipment)

      // Create equipment assignments
      const equipmentAssignments = selectedEquipment.map(equip => ({
        project_id: project.id,
        equipment_id: equip.id,
        start_date: project.start_date || new Date().toISOString(),
        is_active: true,
        created_at: new Date().toISOString()
      }))

      const { error: equipAssignError } = await supabase
        .from('project_equipment_assignments')
        .insert(equipmentAssignments)

      if (equipAssignError) {
        console.error(`Error assigning equipment to project ${project.name}:`, equipAssignError)
      } else {
        console.log(`  - Assigned ${selectedEquipment.length} equipment items`)
      }
    }

    console.log('\n✅ Crew and equipment seeding completed!')

    // Show summary
    const { count: totalCrewAssignments } = await supabase
      .from('project_crew_assignments')
      .select('*', { count: 'exact', head: true })

    const { count: totalEquipmentAssignments } = await supabase
      .from('project_equipment_assignments')
      .select('*', { count: 'exact', head: true })

    console.log('\nSummary:')
    console.log(`- Total crew assignments: ${totalCrewAssignments}`)
    console.log(`- Total equipment assignments: ${totalEquipmentAssignments}`)

  } catch (error) {
    console.error('Error in seeding process:', error)
  } finally {
    process.exit()
  }
}

// Run the seeding
seedCrewAndEquipment()