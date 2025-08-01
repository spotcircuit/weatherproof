// Test real-time weather lookup using the weather-realtime module
import { fetchRealtimeWeather, formatWeatherForDisplay, getWeatherImpactSummary } from './src/lib/weather-realtime.js'

// Test coordinates - Dallas, TX
const latitude = 32.7767
const longitude = -96.7970
const projectId = 'test-realtime-001'

console.log('Testing real-time weather lookup...')
console.log(`Location: ${latitude}, ${longitude} (Dallas, TX)`)
console.log(`Project ID: ${projectId}`)
console.log('---\n')

async function testRealtimeWeather() {
  try {
    const weather = await fetchRealtimeWeather(latitude, longitude, projectId)
    
    if (weather) {
      console.log('✅ Weather data received successfully!\n')
      
      console.log('Raw Data:')
      console.log(JSON.stringify(weather, null, 2))
      console.log('\n---\n')
      
      console.log('Current Conditions:')
      console.log(`Temperature: ${weather.temperature}°${weather.temperatureUnit}`)
      console.log(`Wind: ${weather.wind_speed} mph ${weather.wind_direction}`)
      console.log(`Conditions: ${weather.conditions.join(', ')}`)
      console.log(`Forecast: ${weather.short_forecast}`)
      
      if (weather.precipitation_amount > 0) {
        console.log(`Precipitation: ${weather.precipitation_amount}" (${weather.precipitation_type || 'Unknown'})`)
      }
      
      if (weather.has_alerts) {
        console.log('\n⚠️  Weather Alerts Active!')
      }
      
      console.log('\n---\n')
      
      console.log('Formatted Display:')
      console.log(formatWeatherForDisplay(weather))
      
      console.log('\n---\n')
      
      console.log('Work Impact Analysis:')
      console.log('Impacts:', weather.impacts)
      const impactSummary = getWeatherImpactSummary(weather)
      if (impactSummary.length > 0) {
        console.log('\nImpact Summary:')
        impactSummary.forEach(impact => console.log(`- ${impact}`))
      } else {
        console.log('\n✅ No weather impacts on work activities')
      }
      
    } else {
      console.log('❌ Failed to fetch weather data')
    }
  } catch (error) {
    console.error('Error during test:', error)
  }
}

// Run the test
testRealtimeWeather()