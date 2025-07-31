import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSchema() {
  try {
    // Test query to check if project_type exists
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, project_type')
      .limit(1)
    
    if (error) {
      console.error('Error querying projects:', error)
      console.error('Error details:', error.message)
    } else {
      console.log('Projects table query successful!')
      console.log('Sample data:', data)
    }

    // Try to query weather_threshold_templates
    const { data: templates, error: templatesError } = await supabase
      .from('weather_threshold_templates')
      .select('*')
      .limit(1)
    
    if (templatesError) {
      console.error('Error querying weather_threshold_templates:', templatesError)
      console.error('Error details:', templatesError.message)
    } else {
      console.log('Weather threshold templates table exists!')
      console.log('Sample template:', templates)
    }
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

checkSchema()