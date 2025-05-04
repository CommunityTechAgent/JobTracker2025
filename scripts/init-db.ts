import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function initDatabase() {
  try {
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'lib/db/migrations/001_initial_schema.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    // Split the SQL into individual statements
    const statements = sql.split(';').filter(statement => statement.trim())

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        if (error) {
          console.error('Error executing SQL:', error)
          console.error('Statement:', statement)
        } else {
          console.log('Successfully executed statement')
        }
      }
    }

    console.log('Database initialization completed successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
    process.exit(1)
  }
}

initDatabase() 