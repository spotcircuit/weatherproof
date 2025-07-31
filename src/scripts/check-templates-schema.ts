import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTemplatesSchema() {
  try {
    // Get all weather threshold templates
    const { data, error } = await supabase
      .from('weather_threshold_templates')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('Error querying templates:', error)
    } else {
      console.log('Sample template data:')
      console.log(JSON.stringify(data, null, 2))
      
      if (data && data.length > 0) {
        console.log('\nColumns in weather_threshold_templates:')
        console.log(Object.keys(data[0]))
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

checkTemplatesSchema()