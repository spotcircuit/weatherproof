import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkSchema() {
  // Get a sample crew assignment
  const { data: crewSample } = await supabase
    .from('project_crew_assignments')
    .select('*')
    .limit(1)
    .single()

  console.log('Crew assignment columns:', crewSample ? Object.keys(crewSample) : 'No data')
  
  // Get a sample equipment assignment
  const { data: equipSample } = await supabase
    .from('project_equipment_assignments')
    .select('*')
    .limit(1)
    .single()

  console.log('Equipment assignment columns:', equipSample ? Object.keys(equipSample) : 'No data')
}

checkSchema().then(() => process.exit())