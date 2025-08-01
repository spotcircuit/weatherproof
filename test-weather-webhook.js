// Test weather webhook
// Node 18+ has native fetch, no import needed

// Test data - Dallas coordinates (closer to the alerts we saw)
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

// Your webhook URL and auth from .env
const WEBHOOK_URL = 'https://n8n.spotcircuit.com/webhook/Weather-Lookup';
const WEBHOOK_AUTH = 'LongBeach2023!';

async function testWeatherWebhook() {
  console.log('Testing weather webhook...');
  console.log('URL:', WEBHOOK_URL);
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
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    try {
      const data = JSON.parse(responseText);
      console.log('\nParsed response:', JSON.stringify(data, null, 2));
      
      if (data.temperature) {
        console.log('\n✅ Weather data received:');
        console.log(`Temperature: ${data.temperature}°${data.temperatureUnit || 'F'}`);
        console.log(`Wind Speed: ${data.wind_speed} mph`);
        console.log(`Conditions: ${data.conditions?.join(', ') || 'None'}`);
        console.log(`Has Alerts: ${data.has_alerts}`);
      }
    } catch (parseError) {
      console.log('Could not parse as JSON:', parseError.message);
    }
    
  } catch (error) {
    console.error('Error calling webhook:', error);
  }
}

// Run the test
testWeatherWebhook();