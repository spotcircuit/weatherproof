const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugWeatherQuery() {
  console.log('Current time:', new Date().toLocaleString());
  console.log('Current UTC time:', new Date().toISOString());
  console.log('Timezone offset:', new Date().getTimezoneOffset(), 'minutes');
  console.log('-------------------\n');

  // Run the EXACT same query as the dashboard
  const { data: recentWeather, error } = await supabase
    .from("project_weather")
    .select("*, projects!inner(name, user_id)")
    .eq("projects.user_id", "1b2c1231-26e1-4c49-9e03-6fb4c13b8d4f") // Your user ID from earlier
    .gte("collected_at", new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()) // Last 3 hours only
    .order("collected_at", { ascending: false })
    .limit(10);

  if (error) {
    console.log('Error:', error);
    return;
  }

  console.log('Total records found:', recentWeather?.length || 0);
  
  if (recentWeather && recentWeather.length > 0) {
    console.log('\nFirst (most recent) record:');
    console.log('Project:', recentWeather[0].projects.name);
    console.log('Collected at:', new Date(recentWeather[0].collected_at).toLocaleString());
    console.log('Created at:', new Date(recentWeather[0].created_at).toLocaleString());
    console.log('Data source:', recentWeather[0].data_source);
    
    console.log('\nAll records:');
    recentWeather.forEach(w => {
      console.log(`- ${w.projects.name}: ${new Date(w.collected_at).toLocaleString()}`);
    });
  }

  // Also check without the time filter
  console.log('\n-------------------');
  console.log('Checking without time filter...\n');
  
  const { data: allWeather, error: allError } = await supabase
    .from("project_weather")
    .select("*, projects!inner(name, user_id)")
    .eq("projects.user_id", "1b2c1231-26e1-4c49-9e03-6fb4c13b8d4f")
    .order("collected_at", { ascending: false })
    .limit(5);

  if (allError) {
    console.log('Error:', allError);
    return;
  }

  console.log('Without filter - most recent 5:');
  allWeather?.forEach(w => {
    console.log(`- ${w.projects.name}: ${new Date(w.collected_at).toLocaleString()}`);
  });
}

debugWeatherQuery().catch(console.error);