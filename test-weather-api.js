// Test weather API through Next.js endpoints
// This tests both real-time lookup and the integration with n8n

const BASE_URL = 'http://localhost:3000';

// Test real-time weather lookup through API
async function testRealtimeWeatherAPI() {
  console.log('=== Testing Real-Time Weather API ===\n');
  
  const testData = {
    latitude: 32.7767,
    longitude: -96.7970,
    projectId: 'test-realtime-001'
  };
  
  console.log('Request:', JSON.stringify(testData, null, 2));
  
  try {
    const response = await fetch(`${BASE_URL}/api/weather/realtime`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('\nResponse:', JSON.stringify(data, null, 2));
    
    if (data.success && data.weather) {
      console.log('\n✅ Real-time weather lookup successful!');
      console.log('Formatted display:', data.formatted);
      if (data.impacts && data.impacts.length > 0) {
        console.log('Work impacts:', data.impacts.join(', '));
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Test webhook directly with proper format
async function testN8nWebhookDirect() {
  console.log('\n\n=== Testing n8n Webhook Directly ===\n');
  
  const WEBHOOK_URL = 'https://n8n.spotcircuit.com/webhook/Weather-Lookup';
  const WEBHOOK_AUTH = 'LongBeach2023!';
  
  const testRequest = {
    projectId: "test-project-123",
    latitude: 32.7767,
    longitude: -96.7970,
    requestType: "realtime",
    userId: "test-user-123",
    includeAlerts: true,
    includeHourly: false,
    storeResult: false
  };
  
  console.log('Request:', JSON.stringify(testRequest, null, 2));
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': WEBHOOK_AUTH
      },
      body: JSON.stringify(testRequest)
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    
    // Check if this is raw weather data or processed data
    if (data.features) {
      console.log('\n⚠️  Received raw weather alert data');
      console.log('Total alerts:', data.features.length);
      data.features.forEach((feature, index) => {
        const props = feature.properties;
        console.log(`\nAlert ${index + 1}:`);
        console.log(`- Event: ${props.event}`);
        console.log(`- Severity: ${props.severity}`);
        console.log(`- Area: ${props.areaDesc}`);
        console.log(`- Headline: ${props.headline}`);
      });
    } else {
      console.log('\n✅ Received processed weather data:');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Check weather data in database
async function checkStoredWeatherData() {
  console.log('\n\n=== Checking Stored Weather Data ===\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/weather/stored?projectId=0dabcf22-6b7f-4de2-921c-44e1ca63a727`);
    
    console.log('Response status:', response.status);
    const data = await response.json();
    
    if (data.weather && data.weather.length > 0) {
      console.log(`Found ${data.weather.length} weather records`);
      const latest = data.weather[0];
      console.log('\nLatest weather data:');
      console.log(`- Collected: ${new Date(latest.collected_at).toLocaleString()}`);
      console.log(`- Temperature: ${latest.temperature}°${latest.temperature_unit}`);
      console.log(`- Wind: ${latest.wind_speed} mph ${latest.wind_direction}`);
      console.log(`- Conditions: ${latest.conditions?.join(', ') || 'None'}`);
      console.log(`- Has Alerts: ${latest.has_alerts}`);
      
      if (latest.impacts_concrete || latest.impacts_roofing || latest.impacts_crane || 
          latest.impacts_electrical || latest.impacts_painting) {
        console.log('\nWork impacts:');
        if (latest.impacts_concrete) console.log('- Concrete work affected');
        if (latest.impacts_roofing) console.log('- Roofing work affected');
        if (latest.impacts_crane) console.log('- Crane operations affected');
        if (latest.impacts_electrical) console.log('- Electrical work affected');
        if (latest.impacts_painting) console.log('- Painting work affected');
      }
    } else {
      console.log('No stored weather data found');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run all tests
async function runAllTests() {
  await testRealtimeWeatherAPI();
  await testN8nWebhookDirect();
  await checkStoredWeatherData();
}

runAllTests();