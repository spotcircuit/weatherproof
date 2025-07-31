import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTables() {
  // Check crew_members structure
  const { data: crew, error: crewError } = await supabase
    .from('crew_members')
    .select('*')
    .limit(0)

  if (crewError) {
    console.log('Crew members error:', crewError)
  } else {
    console.log('Crew members table exists')
  }

  // Check equipment structure  
  const { data: equipment, error: equipError } = await supabase
    .from('equipment')
    .select('*')
    .limit(0)

  if (equipError) {
    console.log('Equipment error:', equipError)
  } else {
    console.log('Equipment table exists')
  }

  // Get actual data to see structure
  const { data: sampleCrew } = await supabase
    .from('crew_members')
    .select('*')
    .limit(1)
  
  const { data: sampleEquip } = await supabase
    .from('equipment')
    .select('*')
    .limit(1)

  console.log('\nSample crew member:', sampleCrew?.[0] || 'No crew members found')
  console.log('\nSample equipment:', sampleEquip?.[0] || 'No equipment found')
}

checkTables().then(() => process.exit())