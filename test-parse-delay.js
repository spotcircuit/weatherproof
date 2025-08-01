// Test Parse-Delay webhook
// Node 18+ has native fetch, no import needed

// Test data
const testRequest = {
  description: "Rain delay from 2pm to 4pm due to heavy thunderstorms",
  date: "2025-08-01"
};

// Your webhook URL and auth from .env
const WEBHOOK_URL = 'https://n8n.spotcircuit.com/webhook/Parse-Delay';
const WEBHOOK_AUTH = 'LongBeach2023!';

async function testParseDelayWebhook() {
  console.log('Testing Parse-Delay webhook...');
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
      
      if (data.times) {
        console.log('\n✅ Delay data parsed:');
        console.log(`Start time: ${data.times.start || 'Not found'}`);
        console.log(`End time: ${data.times.end || 'Not found'}`);
        console.log(`Weather: ${data.weather?.conditions?.join(', ') || 'None'}`);
        console.log(`Summary: ${data.summary || 'None'}`);
      }
    } catch (parseError) {
      console.log('Could not parse as JSON:', parseError.message);
    }
    
  } catch (error) {
    console.error('Error calling webhook:', error);
  }
}

// Run the test
testParseDelayWebhook();