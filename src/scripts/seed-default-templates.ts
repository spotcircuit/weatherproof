import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const defaultTemplates = [
  {
    name: 'Roofing Standard',
    description: 'Standard weather thresholds for roofing projects',
    work_types: ['roofing'],
    thresholds: {
      wind_speed_mph: 25,
      precipitation_inches: 0.1,
      min_temp: 40,
      max_temp: 95,
      lightning_radius_miles: 10
    },
    user_id: null
  },
  {
    name: 'Concrete/Foundation',
    description: 'Weather thresholds for concrete and foundation work',
    work_types: ['concrete', 'foundation'],
    thresholds: {
      wind_speed_mph: 30,
      precipitation_inches: 0.25,
      min_temp: 40,
      max_temp: 90,
      humidity_max: 90
    },
    user_id: null
  },
  {
    name: 'Framing',
    description: 'Weather thresholds for framing and structural work',
    work_types: ['framing', 'structural'],
    thresholds: {
      wind_speed_mph: 35,
      precipitation_inches: 0.5,
      min_temp: 20,
      max_temp: 100
    },
    user_id: null
  },
  {
    name: 'Exterior Painting',
    description: 'Weather thresholds for exterior painting',
    work_types: ['painting', 'exterior'],
    thresholds: {
      wind_speed_mph: 20,
      precipitation_inches: 0,
      min_temp: 50,
      max_temp: 90,
      humidity_max: 85
    },
    user_id: null
  },
  {
    name: 'General Construction',
    description: 'General weather thresholds for construction',
    work_types: ['general'],
    thresholds: {
      wind_speed_mph: 40,
      precipitation_inches: 0.5,
      min_temp: 20,
      max_temp: 100
    },
    user_id: null
  }
]

async function seedDefaultTemplates() {
  try {
    // Check if any default templates exist
    const { data: existing } = await supabase
      .from('weather_threshold_templates')
      .select('id')
      .is('user_id', null)
      .limit(1)
    
    if (existing && existing.length > 0) {
      console.log('Default templates already exist, skipping seed')
      return
    }

    // Insert default templates
    const { data, error } = await supabase
      .from('weather_threshold_templates')
      .insert(defaultTemplates)
      .select()
    
    if (error) {
      console.error('Error inserting templates:', error)
    } else {
      console.log('Successfully inserted default templates:')
      console.log(data)
    }
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

seedDefaultTemplates()