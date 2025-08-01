// Test scheduled weather collection endpoint
// Simulates a cron job calling the API

const API_URL = 'http://localhost:3000/api/weather/collect-scheduled';
const AUTH_TOKEN = 'LongBeach2023!'; // Using N8N_WEBHOOK_AUTH for now

async function testScheduledWeatherCollection() {
  console.log('Testing scheduled weather collection...');
  console.log('URL:', API_URL);
  console.log('Auth:', AUTH_TOKEN);
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': AUTH_TOKEN
      }
    });
    
    console.log('\nResponse status:', response.status);
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    try {
      const data = JSON.parse(responseText);
      console.log('\nParsed response:', JSON.stringify(data, null, 2));
      
      if (data.processed) {
        console.log('\n📊 Summary:');
        console.log(`Total projects processed: ${data.processed}`);
        console.log(`Successful: ${data.successful}`);
        console.log(`Skipped: ${data.skipped}`);
        console.log(`Failed: ${data.failed}`);
        
        if (data.results && data.results.length > 0) {
          console.log('\n✅ Results:');
          data.results.forEach(result => {
            console.log(`- ${result.projectName}: ${result.status}`);
            if (result.temperature) {
              console.log(`  Temperature: ${result.temperature}°F`);
              console.log(`  Conditions: ${result.conditions?.join(', ') || 'None'}`);
              console.log(`  Has Alerts: ${result.hasAlerts ? 'Yes' : 'No'}`);
            }
            if (result.reason) {
              console.log(`  Reason: ${result.reason}`);
            }
          });
        }
        
        if (data.errors && data.errors.length > 0) {
          console.log('\n❌ Errors:');
          data.errors.forEach(error => {
            console.log(`- ${error.projectName}: ${error.error}`);
          });
        }
      }
    } catch (parseError) {
      console.log('Could not parse as JSON:', parseError.message);
    }
    
  } catch (error) {
    console.error('Error calling webhook:', error);
  }
}

// Test the GET endpoint first to see documentation
async function testGetEndpoint() {
  console.log('Testing GET endpoint for documentation...\n');
  
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    console.log('Endpoint documentation:', JSON.stringify(data, null, 2));
    console.log('\n---\n');
  } catch (error) {
    console.error('Error fetching documentation:', error);
  }
}

// Run the tests
async function runTests() {
  await testGetEndpoint();
  await testScheduledWeatherCollection();
}

runTests();