const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkWeatherStatus() {
  console.log('Current time:', new Date().toLocaleString());
  console.log('-------------------\n');

  // Check cron job
  const { data: cronJobs, error: cronError } = await supabase
    .from('cron.job')
    .select('*');
  
  console.log('Cron job status:');
  if (cronError) {
    console.log('Error fetching cron jobs:', cronError.message);
  } else {
    console.log(cronJobs);
  }
  console.log('\n-------------------\n');

  // Check last weather collections
  const { data: recentWeather, error: weatherError } = await supabase
    .from('project_weather')
    .select(`
      *,
      projects (name)
    `)
    .order('collected_at', { ascending: false })
    .limit(10);

  console.log('Last 10 weather collections:');
  if (weatherError) {
    console.log('Error:', weatherError);
  } else {
    recentWeather?.forEach(w => {
      const timeAgo = new Date() - new Date(w.collected_at);
      const minutesAgo = Math.floor(timeAgo / 1000 / 60);
      console.log(`${w.projects.name}: ${new Date(w.collected_at).toLocaleString()} (${minutesAgo} minutes ago)`);
    });
  }
  console.log('\n-------------------\n');

  // Check project update status
  const { data: projects, error: projectError } = await supabase
    .from('projects')
    .select('id, name, weather_last_collected_at, weather_collection_enabled, active')
    .eq('active', true)
    .order('weather_last_collected_at', { ascending: true, nullsFirst: true });

  console.log('Project weather update status:');
  if (projectError) {
    console.log('Error:', projectError);
  } else {
    projects?.forEach(p => {
      if (p.weather_last_collected_at) {
        const timeAgo = new Date() - new Date(p.weather_last_collected_at);
        const minutesAgo = Math.floor(timeAgo / 1000 / 60);
        const status = minutesAgo > 35 ? '⚠️ NEEDS UPDATE' : '✅ OK';
        console.log(`${p.name}: Last updated ${minutesAgo} minutes ago ${status}`);
      } else {
        console.log(`${p.name}: NEVER UPDATED ❌`);
      }
    });
  }

  // Try to run the scheduled collection manually
  console.log('\n-------------------\n');
  console.log('Running scheduled_weather_collection() manually...');
  
  const { data: result, error: execError } = await supabase
    .rpc('scheduled_weather_collection');
  
  if (execError) {
    console.log('Error running collection:', execError);
  } else {
    console.log('Result:', result);
  }
}

checkWeatherStatus().catch(console.error);