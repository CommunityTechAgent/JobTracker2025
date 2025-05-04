import { Pool } from "pg"

let pool: Pool | null = null
let connectionAttempts = 0
const MAX_CONNECTION_ATTEMPTS = 3

export function getDB() {
  if (!pool) {
    try {
      console.log("Creating new database connection pool...")

      // Check if we have the required environment variables
      if (!process.env.POSTGRES_URL) {
        console.error("POSTGRES_URL environment variable is not defined")
        throw new Error("Database connection string is not configured")
      }

      pool = new Pool({
        connectionString: process.env.POSTGRES_URL,
        ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
        // Add connection timeout
        connectionTimeoutMillis: 5000,
        // Add idle timeout
        idleTimeoutMillis: 10000,
      })

      // Add error handler to the pool
      pool.on("error", (err) => {
        console.error("Unexpected error on idle client", err)
        pool = null // Reset pool on error
      })

      console.log("Database connection pool created")
    } catch (error) {
      console.error("Error creating database connection pool:", error)
      throw error
    }
  }
  return pool
}

// Check if the database connection is available
export async function isDatabaseAvailable() {
  connectionAttempts = 0
  return await tryDatabaseConnection()
}

async function tryDatabaseConnection() {
  try {
    if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
      console.error(`Failed to connect to database after ${MAX_CONNECTION_ATTEMPTS} attempts`)
      return false
    }

    connectionAttempts++
    console.log(`Database connection attempt ${connectionAttempts}...`)

    // Reset pool if it exists but might be in a bad state
    if (connectionAttempts > 1 && pool) {
      console.log("Resetting database connection pool...")
      await pool.end()
      pool = null
    }

    const db = getDB()
    const result = await db.query("SELECT 1 as connection_test")

    if (result && result.rows && result.rows[0] && result.rows[0].connection_test === 1) {
      console.log("Database connection successful")
      return true
    }

    console.error("Database connection check failed: unexpected response")
    return false
  } catch (error) {
    console.error(`Database connection attempt ${connectionAttempts} failed:`, error)

    // Try again with exponential backoff
    if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
      const delay = Math.pow(2, connectionAttempts) * 100
      console.log(`Retrying in ${delay}ms...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
      return await tryDatabaseConnection()
    }

    return false
  }
}

// Check if a table exists
export async function doesTableExist(tableName: string) {
  try {
    const db = getDB()
    const result = await db.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )
    `,
      [tableName],
    )

    return result.rows[0].exists
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error)
    return false
  }
}
