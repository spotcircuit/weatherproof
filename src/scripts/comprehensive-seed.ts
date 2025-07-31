import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { format, subDays, addHours, startOfDay, addDays } from 'date-fns'

config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedComprehensiveData() {
  try {
    console.log('🌱 Starting comprehensive seed...')
    
    // Get demo user
    const { data: userData } = await supabase.auth.admin.listUsers()
    const demoUser = userData?.users.find(u => u.email === 'demo@weatherproof.app')
    
    if (!demoUser) {
      console.error('Demo user not found. Please run basic seed first.')
      return
    }

    const userId = demoUser.id
    console.log('Found demo user:', userId)

    // 1. Create company settings
    console.log('Creating company settings...')
    const { error: companyError } = await supabase
      .from('company_settings')
      .upsert({
        user_id: userId,
        company_name: 'Demo Construction Co',
        company_logo: 'https://via.placeholder.com/200x200',
        company_address: '123 Construction Way, Austin, TX 78701',
        company_phone: '(512) 555-0123',
        company_email: 'info@democonstruction.com',
        license_number: 'TX-LIC-123456',
        tax_id: '12-3456789',
        website: 'https://democonstruction.com',
        default_hourly_rate: 85,
        default_crew_size: 8,
        weather_api_keys: {
          noaa: 'demo-key-noaa',
          weatherunderground: 'demo-key-wu',
          visualcrossing: 'demo-key-vc'
        }
      })

    if (companyError) {
      console.error('Error creating company settings:', companyError)
    }

    // 2. Create weather threshold templates
    console.log('Creating weather threshold templates...')
    const templates = [
      {
        user_id: userId,
        name: 'Concrete Work',
        description: 'Strict thresholds for concrete pouring and finishing',
        thresholds: {
          wind_speed_mph: 20,
          precipitation_inches: 0.1,
          min_temp: 45,
          max_temp: 90,
          humidity_max: 85,
          visibility_miles: 1,
          lightning_radius_miles: 15
        },
        work_types: ['concrete', 'foundation']
      },
      {
        user_id: userId,
        name: 'Roofing',
        description: 'Safety thresholds for roofing work',
        thresholds: {
          wind_speed_mph: 15,
          precipitation_inches: 0,
          min_temp: 40,
          max_temp: 100,
          humidity_max: 95,
          visibility_miles: 0.5,
          lightning_radius_miles: 20
        },
        work_types: ['roofing', 'exterior']
      },
      {
        user_id: userId,
        name: 'General Construction',
        description: 'Standard thresholds for most construction activities',
        thresholds: {
          wind_speed_mph: 25,
          precipitation_inches: 0.25,
          min_temp: 35,
          max_temp: 95,
          humidity_max: 90,
          visibility_miles: 0.25,
          lightning_radius_miles: 10
        },
        work_types: ['general', 'framing', 'electrical', 'plumbing']
      }
    ]

    for (const template of templates) {
      await supabase.from('weather_threshold_templates').insert(template)
    }

    // 3. Create crew members
    console.log('Creating crew members...')
    const crewMembers = [
      {
        user_id: userId,
        name: 'John Smith',
        role: 'Foreman',
        phone: '(512) 555-0201',
        email: 'john.smith@demo.com',
        hourly_rate: 95,
        emergency_contact: 'Jane Smith',
        emergency_phone: '(512) 555-0202',
        certifications: ['OSHA 30', 'First Aid', 'Crane Operator']
      },
      {
        user_id: userId,
        name: 'Mike Johnson',
        role: 'Lead Carpenter',
        phone: '(512) 555-0203',
        email: 'mike.j@demo.com',
        hourly_rate: 75,
        emergency_contact: 'Sarah Johnson',
        emergency_phone: '(512) 555-0204',
        certifications: ['OSHA 10', 'Forklift']
      },
      {
        user_id: userId,
        name: 'Carlos Rodriguez',
        role: 'Concrete Specialist',
        phone: '(512) 555-0205',
        email: 'carlos.r@demo.com',
        hourly_rate: 80,
        emergency_contact: 'Maria Rodriguez',
        emergency_phone: '(512) 555-0206',
        certifications: ['ACI Concrete', 'OSHA 10']
      },
      {
        user_id: userId,
        name: 'David Lee',
        role: 'Equipment Operator',
        phone: '(512) 555-0207',
        email: 'david.l@demo.com',
        hourly_rate: 85,
        emergency_contact: 'Susan Lee',
        emergency_phone: '(512) 555-0208',
        certifications: ['Heavy Equipment', 'CDL', 'OSHA 10']
      },
      {
        user_id: userId,
        name: 'Tom Wilson',
        role: 'Carpenter',
        phone: '(512) 555-0209',
        email: 'tom.w@demo.com',
        hourly_rate: 65,
        emergency_contact: 'Lisa Wilson',
        emergency_phone: '(512) 555-0210',
        certifications: ['OSHA 10']
      }
    ]

    const { data: crewData } = await supabase
      .from('crew_members')
      .insert(crewMembers)
      .select()

    // 4. Create equipment
    console.log('Creating equipment...')
    const equipment = [
      {
        user_id: userId,
        name: 'CAT 336 Excavator',
        type: 'Heavy Equipment',
        daily_rate: 1200,
        hourly_rate: 150,
        description: '36-ton hydraulic excavator',
        serial_number: 'CAT336-2024-001',
        purchase_date: '2024-01-15'
      },
      {
        user_id: userId,
        name: 'Concrete Pump Truck',
        type: 'Specialty Equipment',
        daily_rate: 2000,
        hourly_rate: 250,
        description: '32-meter boom pump',
        serial_number: 'PUMP-2023-456',
        purchase_date: '2023-06-20'
      },
      {
        user_id: userId,
        name: 'Tower Crane',
        type: 'Heavy Equipment',
        daily_rate: 3000,
        hourly_rate: 375,
        description: '250-ton capacity tower crane',
        serial_number: 'CRANE-2022-789',
        purchase_date: '2022-03-10'
      },
      {
        user_id: userId,
        name: 'Bobcat S650 Skid Steer',
        type: 'Light Equipment',
        daily_rate: 400,
        hourly_rate: 50,
        description: 'Compact skid steer loader',
        serial_number: 'BOB-2024-123',
        purchase_date: '2024-02-01'
      }
    ]

    const { data: equipmentData } = await supabase
      .from('equipment')
      .insert(equipment)
      .select()

    // 5. Get existing projects
    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (projects && projects.length > 0) {
      // 6. Create comprehensive weather data for projects
      console.log('Creating comprehensive weather data...')
      
      for (const project of projects) {
        // Create 30 days of detailed weather readings
        for (let i = 0; i < 30; i++) {
          const date = subDays(new Date(), i)
          
          // Create 4 readings per day (6-hour intervals)
          for (let hour of [6, 12, 18, 0]) {
            const timestamp = addHours(startOfDay(date), hour)
            
            // Simulate realistic weather patterns
            const isStorm = Math.random() > 0.85
            const isCold = Math.random() > 0.9
            const isHot = Math.random() > 0.9
            const isWindy = Math.random() > 0.8
            
            const reading = {
              project_id: project.id,
              timestamp: timestamp.toISOString(),
              temperature: isStorm ? 65 + Math.random() * 10 :
                          isCold ? 30 + Math.random() * 10 :
                          isHot ? 95 + Math.random() * 10 :
                          60 + Math.random() * 30,
              humidity: isStorm ? 80 + Math.random() * 20 : 40 + Math.random() * 40,
              wind_speed: isStorm ? 25 + Math.random() * 20 :
                         isWindy ? 20 + Math.random() * 15 :
                         5 + Math.random() * 15,
              wind_direction: Math.floor(Math.random() * 360),
              precipitation: isStorm ? 0.5 + Math.random() * 2 : 0,
              conditions: isStorm ? 'Thunderstorm' :
                         isCold ? 'Cold and Clear' :
                         isHot ? 'Hot and Humid' :
                         isWindy ? 'Windy' :
                         'Clear',
              source: ['NOAA', 'Weather Underground', 'Visual Crossing'][Math.floor(Math.random() * 3)],
              source_station_id: `KAUS${Math.floor(Math.random() * 10)}`,
              visibility: isStorm ? 0.5 + Math.random() * 2 : 5 + Math.random() * 5,
              pressure: 29.5 + Math.random() * 1,
              uv_index: hour === 12 ? Math.floor(5 + Math.random() * 6) : 0,
              feels_like: 0,
              dew_point: 50 + Math.random() * 20,
              cloud_cover: isStorm ? 80 + Math.random() * 20 : Math.random() * 50,
              lightning_detected: isStorm && Math.random() > 0.5,
              raw_data: {
                source_timestamp: timestamp.toISOString(),
                quality: 'verified',
                station_distance_miles: Math.random() * 10
              }
            }
            
            // Calculate feels like temperature
            reading.feels_like = reading.wind_speed > 10 
              ? reading.temperature - (reading.wind_speed * 0.3)
              : reading.temperature + (reading.humidity * 0.1)
            
            await supabase.from('weather_readings').insert(reading)
          }
        }

        // 7. Create detailed delay events
        console.log(`Creating detailed delay events for ${project.name}...`)
        
        const delayScenarios = [
          {
            days_ago: 25,
            duration_hours: 6,
            weather: 'Heavy Rain',
            details: 'Torrential rain flooded excavation area',
            materials_damaged: true,
            materials_cost: 5000,
            supervisor_notes: 'Site was completely waterlogged. Had to pump out foundation excavation. Some rebar will need replacement due to mud contamination.'
          },
          {
            days_ago: 18,
            duration_hours: 4,
            weather: 'High Winds',
            details: 'Sustained winds over 35mph, gusts to 50mph',
            materials_damaged: false,
            materials_cost: 0,
            supervisor_notes: 'Crane operations suspended for safety. Secured all loose materials. No damage reported.'
          },
          {
            days_ago: 12,
            duration_hours: 8,
            weather: 'Lightning',
            details: 'Severe thunderstorm with frequent lightning',
            materials_damaged: false,
            materials_cost: 0,
            supervisor_notes: 'All outdoor work suspended. Crew sheltered in place. Multiple lightning strikes within 5 miles.'
          },
          {
            days_ago: 7,
            duration_hours: 3,
            weather: 'Extreme Cold',
            details: 'Temperature dropped to 28°F',
            materials_damaged: true,
            materials_cost: 2500,
            supervisor_notes: 'Concrete pour cancelled. Some materials had to be protected with insulated blankets. Minor frost damage to exposed pipes.'
          },
          {
            days_ago: 2,
            duration_hours: 5,
            weather: 'Heavy Rain and Wind',
            details: 'Combined rain and wind event',
            materials_damaged: false,
            materials_cost: 0,
            supervisor_notes: 'Ongoing weather event. Secured site and sent crew home early. Monitoring conditions.'
          }
        ]

        for (const scenario of delayScenarios) {
          const startTime = subDays(new Date(), scenario.days_ago)
          const endTime = scenario.days_ago > 3 
            ? addHours(startTime, scenario.duration_hours)
            : null // Recent delays might still be active

          const delay = {
            project_id: project.id,
            start_time: startTime.toISOString(),
            end_time: endTime?.toISOString() || null,
            weather_condition: scenario.weather,
            delay_reason: scenario.details,
            crew_size: project.crew_size,
            hourly_rate: project.hourly_rate,
            duration_hours: endTime ? scenario.duration_hours : null,
            labor_hours_lost: endTime ? scenario.duration_hours * project.crew_size : null,
            labor_cost: endTime ? scenario.duration_hours * project.crew_size * project.hourly_rate : null,
            equipment_cost: endTime ? scenario.duration_hours * 150 : null, // Average equipment cost
            overhead_cost: endTime ? (project.daily_overhead / 8) * scenario.duration_hours : null,
            total_cost: 0,
            verified: endTime ? true : false,
            delay_type: 'weather',
            crew_affected: project.crew_size,
            equipment_idle_cost: endTime ? scenario.duration_hours * 150 : 0,
            materials_damaged: scenario.materials_damaged,
            materials_damage_cost: scenario.materials_cost,
            photos: endTime ? {
              count: Math.floor(2 + Math.random() * 4),
              urls: []
            } : null,
            supervisor_notes: scenario.supervisor_notes,
            verified_by: endTime ? 'John Smith (Foreman)' : null,
            verified_at: endTime ? addHours(endTime, 1).toISOString() : null,
            noaa_report_url: `https://weather.gov/archive/${format(startTime, 'yyyy-MM-dd')}`
          }

          if (delay.end_time) {
            delay.total_cost = (delay.labor_cost || 0) + 
                              (delay.equipment_cost || 0) + 
                              (delay.overhead_cost || 0) + 
                              (delay.materials_damage_cost || 0)
          }

          await supabase.from('delay_events').insert(delay)
        }

        // 8. Create weather forecasts
        console.log(`Creating weather forecasts for ${project.name}...`)
        
        for (let i = 0; i < 7; i++) {
          const forecastDate = addDays(new Date(), i)
          
          const forecast = {
            project_id: project.id,
            forecast_date: format(forecastDate, 'yyyy-MM-dd'),
            source: 'NOAA',
            forecast_data: {
              high_temp: 70 + Math.random() * 20,
              low_temp: 50 + Math.random() * 20,
              precipitation_chance: Math.random() * 100,
              precipitation_amount: Math.random() > 0.7 ? Math.random() * 2 : 0,
              wind_speed_max: 10 + Math.random() * 20,
              conditions: ['Clear', 'Partly Cloudy', 'Cloudy', 'Rain', 'Thunderstorms'][Math.floor(Math.random() * 5)],
              hourly: Array.from({ length: 24 }, (_, hour) => ({
                hour,
                temp: 60 + Math.random() * 30,
                precipitation_chance: Math.random() * 100,
                wind_speed: 5 + Math.random() * 20,
                conditions: ['Clear', 'Cloudy', 'Rain'][Math.floor(Math.random() * 3)]
              }))
            }
          }
          
          await supabase.from('weather_forecasts').insert(forecast)
        }

        // 9. Assign crew to project
        if (crewData && project.active) {
          console.log(`Assigning crew to ${project.name}...`)
          
          for (const crew of crewData.slice(0, 3)) {
            await supabase.from('project_crew_assignments').insert({
              project_id: project.id,
              crew_member_id: crew.id,
              role: crew.role,
              start_date: project.start_date,
              hourly_rate: crew.hourly_rate
            })
          }
        }

        // 10. Assign equipment to project
        if (equipmentData && project.active) {
          console.log(`Assigning equipment to ${project.name}...`)
          
          const equipmentToAssign = project.project_type === 'Concrete' 
            ? equipmentData.filter((e: any) => e.name.includes('Concrete') || e.name.includes('Bobcat'))
            : equipmentData.slice(0, 2)
          
          for (const equip of equipmentToAssign) {
            await supabase.from('project_equipment_assignments').insert({
              project_id: project.id,
              equipment_id: equip.id,
              start_date: project.start_date,
              daily_rate: equip.daily_rate
            })
          }
        }
      }
    }

    // 11. Create document templates
    console.log('Creating document templates...')
    const documentTemplates = [
      {
        user_id: userId,
        name: 'Weather Delay Notice',
        type: 'delay_notice',
        content: `
WEATHER DELAY NOTICE

Project: {{project_name}}
Date: {{date}}
Location: {{project_address}}

This notice confirms that work was suspended on the above project due to adverse weather conditions.

Weather Conditions:
{{weather_conditions}}

Time Period:
Start: {{start_time}}
End: {{end_time}}
Duration: {{duration}} hours

Crew Affected: {{crew_size}} workers
Hourly Rate: $\{{hourly_rate}}/hour

Total Labor Cost: ${{labor_cost}}
Equipment Idle Cost: ${{equipment_cost}}
Total Delay Cost: ${{total_cost}}

Verified by: {{supervisor_name}}
Date: {{verified_date}}
        `,
        variables: ['project_name', 'date', 'project_address', 'weather_conditions', 'start_time', 'end_time', 'duration', 'crew_size', 'hourly_rate', 'labor_cost', 'equipment_cost', 'total_cost', 'supervisor_name', 'verified_date']
      },
      {
        user_id: userId,
        name: 'Insurance Claim Cover Letter',
        type: 'insurance_letter',
        content: `
[Date]

[Insurance Company]
[Address]

Re: Weather Delay Claim - {{project_name}}
Policy Number: {{policy_number}}
Claim Period: {{start_date}} to {{end_date}}

Dear Claims Department,

We are submitting this claim for weather-related delays on the above-referenced project. Enclosed please find comprehensive documentation supporting our claim for {{total_delays}} weather delay events totaling {{total_hours}} hours and ${{total_cost}} in documented costs.

The delays were caused by weather conditions that exceeded the contractual thresholds for safe work continuation. All delays have been verified with supporting weather data from official NOAA sources.

Enclosed Documents:
- Detailed delay event reports
- NOAA weather verification
- Photographic documentation
- Daily logs and timesheets
- Cost breakdown analysis

Please contact us if you require any additional information.

Sincerely,

{{company_name}}
{{contact_name}}
{{contact_phone}}
{{contact_email}}
        `,
        variables: ['project_name', 'policy_number', 'start_date', 'end_date', 'total_delays', 'total_hours', 'total_cost', 'company_name', 'contact_name', 'contact_phone', 'contact_email']
      }
    ]

    for (const template of documentTemplates) {
      await supabase.from('document_templates').insert(template)
    }

    // 12. Create sample integrations
    console.log('Creating integrations...')
    const integrations = [
      {
        user_id: userId,
        type: 'crm',
        name: 'Procore Integration',
        config: {
          api_key: 'demo-procore-key',
          company_id: 'demo-company-123',
          sync_projects: true,
          sync_crew: true,
          sync_weather: false
        },
        active: true,
        last_sync: subDays(new Date(), 1).toISOString()
      },
      {
        user_id: userId,
        type: 'accounting',
        name: 'QuickBooks Online',
        config: {
          client_id: 'demo-qb-client',
          realm_id: 'demo-realm-123',
          sync_invoices: true,
          sync_timesheets: true
        },
        active: true,
        last_sync: subDays(new Date(), 2).toISOString()
      },
      {
        user_id: userId,
        type: 'weather',
        name: 'Weather Underground PWS',
        config: {
          api_key: 'demo-wu-key',
          station_ids: ['KTXAUSTI123', 'KTXAUSTI456'],
          polling_interval_minutes: 15
        },
        active: true,
        last_sync: new Date().toISOString()
      }
    ]

    for (const integration of integrations) {
      await supabase.from('integrations').insert(integration)
    }

    console.log('✅ Comprehensive seed completed successfully!')
    console.log('📊 Created:')
    console.log('   - Company settings')
    console.log('   - Weather threshold templates')
    console.log('   - Crew members')
    console.log('   - Equipment')
    console.log('   - Detailed weather data (30 days)')
    console.log('   - Comprehensive delay events')
    console.log('   - Weather forecasts (7 days)')
    console.log('   - Crew & equipment assignments')
    console.log('   - Document templates')
    console.log('   - Integrations')

  } catch (error) {
    console.error('❌ Seed error:', error)
  } finally {
    process.exit()
  }
}

seedComprehensiveData()