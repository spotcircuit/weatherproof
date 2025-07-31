import { createClient } from '@/lib/supabase'
import fs from 'fs'
import path from 'path'

async function runMigrations() {
  const supabase = createClient()
  
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort() // Ensure they run in order
  
  console.log(`Found ${files.length} migration files`)
  
  for (const file of files) {
    console.log(`\nRunning migration: ${file}`)
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql })
      if (error) {
        console.error(`Error in ${file}:`, error)
      } else {
        console.log(`✓ ${file} completed successfully`)
      }
    } catch (err) {
      console.error(`Failed to run ${file}:`, err)
    }
  }
  
  console.log('\nAll migrations completed')
}

// Note: This won't work directly due to Supabase security
// You'll need to run these migrations through the Supabase dashboard
console.log(`
To run migrations:
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the contents of: supabase/migrations/015_create_delays_and_project_activities.sql
`)

export default runMigrations