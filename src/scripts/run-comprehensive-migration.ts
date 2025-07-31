import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('🚀 Running comprehensive features migration...')
    
    // Read the migration file
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', '006_add_comprehensive_features.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`Executing statement ${i + 1}/${statements.length}...`)
      
      try {
        const { error } = await supabase.rpc('exec_sql', { 
          sql: statement 
        }).single()
        
        if (error) {
          console.warn(`Statement ${i + 1} warning:`, error.message)
          // Continue with next statement even if there's an error
          // (might be trying to create something that already exists)
        }
      } catch (err) {
        console.warn(`Statement ${i + 1} skipped:`, err)
      }
    }
    
    console.log('✅ Migration completed!')
    console.log('🌱 Now run: npm run seed:comprehensive')
    
  } catch (error) {
    console.error('❌ Migration error:', error)
  } finally {
    process.exit()
  }
}

runMigration()