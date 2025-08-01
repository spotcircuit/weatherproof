// Test weather integration using actual project data
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bqfdzuluqqsrbdohjnzd.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZmR6dWx1cXFzcmJkb2hqbnpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgwNDAzOCwiZXhwIjoyMDY5MzgwMDM4fQ.rj6Ag96MwAJ2jcCQJxGTkurfFw9gfoiRKIE3Ng1U7IA'
)

const BASE_URL = 'http://localhost:3000'

async function testProjectWeather() {
  console.log('=== Testing Weather with Real Project Data ===\n')
  
  // Step 1: Get active projects with coordinates
  console.log('1. Fetching active projects with coordinates...')
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, name, address, latitude, longitude, weather_collection_enabled')
    .eq('active', true)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .limit(3)
  
  if (error) {
    console.error('Error fetching projects:', error)
    return
  }
  
  console.log(`Found ${projects.length} projects with coordinates:\n`)
  projects.forEach(p => {
    console.log(`- ${p.name}`)
    console.log(`  ID: ${p.id}`)
    console.log(`  Address: ${p.address}`)
    console.log(`  Coordinates: ${p.latitude}, ${p.longitude}`)
    console.log(`  Weather Collection: ${p.weather_collection_enabled ? 'Enabled' : 'Disabled'}`)
    console.log()
  })
  
  // Step 2: Test real-time weather for first project
  if (projects.length > 0) {
    const testProject = projects[0]
    console.log(`\n2. Testing real-time weather for: ${testProject.name}`)
    console.log('-------------------------------------------\n')
    
    try {
      const response = await fetch(`${BASE_URL}/api/weather/realtime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: testProject.id,
          latitude: testProject.latitude,
          longitude: testProject.longitude
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        console.log('✅ Real-time weather fetched successfully!\n')
        console.log('Weather Data:')
        console.log(`- Temperature: ${data.weather.temperature}°${data.weather.temperatureUnit}`)
        console.log(`- Conditions: ${data.weather.conditions.join(', ')}`)
        console.log(`- Wind: ${data.weather.wind_speed} mph ${data.weather.wind_direction}`)
        console.log(`- Forecast: ${data.weather.short_forecast}`)
        console.log(`- Has Alerts: ${data.weather.has_alerts}`)
        
        console.log('\nWork Impacts:')
        Object.entries(data.weather.impacts).forEach(([type, impacted]) => {
          console.log(`- ${type}: ${impacted ? '⚠️ IMPACTED' : '✅ OK'}`)
        })
        
        console.log('\nFormatted Display:')
        console.log(data.formatted)
        
        if (data.impacts && data.impacts.length > 0) {
          console.log('\nImpact Summary:')
          data.impacts.forEach(impact => console.log(`- ${impact}`))
        }
      } else {
        console.log('❌ Failed to fetch weather:', data.error)
      }
    } catch (error) {
      console.error('Error calling API:', error)
    }
    
    // Step 3: Check stored weather data
    console.log(`\n\n3. Checking stored weather data for project...`)
    console.log('-------------------------------------------\n')
    
    try {
      const response = await fetch(`${BASE_URL}/api/weather/project/${testProject.id}`)
      const data = await response.json()
      
      if (data.latest) {
        console.log('Latest stored weather:')
        console.log(`- Collected at: ${new Date(data.latest.collected_at).toLocaleString()}`)
        console.log(`- Temperature: ${data.latest.temperature}°${data.latest.temperature_unit}`)
        console.log(`- Wind: ${data.latest.wind_speed} mph`)
        console.log(`- Data Source: ${data.latest.data_source}`)
        
        console.log(`\nTotal records: ${data.history.length}`)
        console.log(`Active alerts: ${data.alerts.length}`)
      } else {
        console.log('No stored weather data found for this project')
      }
    } catch (error) {
      console.error('Error fetching stored data:', error)
    }
  }
  
  // Step 4: Test scheduled collection
  console.log(`\n\n4. Testing scheduled weather collection...`)
  console.log('-------------------------------------------\n')
  
  try {
    const response = await fetch(`${BASE_URL}/api/weather/collect-scheduled`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'LongBeach2023!'
      }
    })
    
    const data = await response.json()
    console.log('Collection Results:')
    console.log(`- Processed: ${data.processed} projects`)
    console.log(`- Successful: ${data.successful}`)
    console.log(`- Skipped: ${data.skipped}`)
    console.log(`- Failed: ${data.failed}`)
    
    if (data.results && data.results.length > 0) {
      console.log('\nProject Results:')
      data.results.forEach(result => {
        console.log(`- ${result.projectName}: ${result.status}`)
      })
    }
  } catch (error) {
    console.error('Error with scheduled collection:', error)
  }
}

// Run the test
testProjectWeather()