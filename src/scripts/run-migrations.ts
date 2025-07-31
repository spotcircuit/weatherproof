// Script to run all database migrations
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigrations() {
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')
  const migrationFiles = [
    '001_initial_schema.sql',
    '002_enhanced_schema.sql',
    '003_add_photos.sql',
    '004_fix_user_signup.sql',
    '005_add_survey_responses.sql',
    '007_add_weather_threshold_templates.sql',
    '008_add_project_crew_equipment_relationships.sql',
    '009_add_insurance_requirements.sql'
  ]

  console.log('Running database migrations...\n')

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file)
    
    try {
      console.log(`Running ${file}...`)
      const sql = fs.readFileSync(filePath, 'utf-8')
      
      // Execute the SQL
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).single()
      
      if (error) {
        // Try direct execution if RPC doesn't exist
        const statements = sql.split(';').filter(s => s.trim())
        
        for (const statement of statements) {
          if (statement.trim()) {
            const { error: execError } = await supabase
              .from('_migrations')
              .select('*')
              .limit(1)
              .single()
              .then(() => {
                // This is a hack - we can't directly execute SQL via the client library
                // So we'll use a different approach
                throw new Error('Cannot execute SQL directly via client')
              })
          }
        }
      }
      
      console.log(`✅ ${file} completed`)
    } catch (error) {
      console.error(`❌ Error running ${file}:`, error)
      console.log('\nYou need to run these migrations manually in Supabase dashboard')
      break
    }
  }
}

// Alternative approach using raw PostgreSQL connection
async function runMigrationsViaAPI() {
  console.log('\nAttempting to run migrations via Supabase Management API...')
  
  // Read all migration files
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')
  const migrationFiles = [
    '001_initial_schema.sql',
    '002_enhanced_schema.sql', 
    '003_add_photos.sql',
    '004_fix_user_signup.sql',
    '005_add_survey_responses.sql'
  ]

  console.log('\nMigration files found:')
  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file)
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath)
      console.log(`- ${file} (${stats.size} bytes)`)
    }
  }

  console.log('\n📋 To run these migrations:')
  console.log('1. Go to your Supabase Dashboard')
  console.log('2. Navigate to SQL Editor')
  console.log('3. Copy and paste each migration file in order')
  console.log('4. Click "Run" for each migration')
  
  console.log('\nOr use the Supabase CLI:')
  console.log('1. Install: npm install -g supabase')
  console.log('2. Login: supabase login')
  console.log('3. Link: supabase link --project-ref [your-project-ref]')
  console.log('4. Run: supabase db push')
}

// Since we can't directly execute SQL via the client library,
// let's create a helper script that outputs all migrations as one file
async function createCombinedMigration() {
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')
  const outputPath = path.join(process.cwd(), 'all-migrations.sql')
  
  const migrationFiles = [
    '001_initial_schema.sql',
    '002_enhanced_schema.sql',
    '003_add_photos.sql', 
    '004_fix_user_signup.sql',
    '005_add_survey_responses.sql'
  ]

  let combinedSQL = '-- Combined WeatherProof Migrations\n-- Run this in Supabase SQL Editor\n\n'

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file)
    if (fs.existsSync(filePath)) {
      const sql = fs.readFileSync(filePath, 'utf-8')
      combinedSQL += `\n-- ${file}\n${sql}\n`
    }
  }

  fs.writeFileSync(outputPath, combinedSQL)
  console.log(`\n✅ Created combined migration file: ${outputPath}`)
  console.log('Copy the contents of this file and run in Supabase SQL Editor')
}

// Run the script
runMigrationsViaAPI()
createCombinedMigration()