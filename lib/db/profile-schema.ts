import { sql } from "@vercel/postgres"
import { isDatabaseAvailable } from "@/lib/db/connection"

// Initialize database schema for user profiles
export async function initializeProfileSchema() {
  try {
    // Check if database is available
    const dbAvailable = await isDatabaseAvailable()
    if (!dbAvailable) {
      console.log("Database connection not available, skipping schema initialization")
      return { success: false, error: "Database connection not available", dbAvailable: false }
    }

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        profile_image_url VARCHAR(500),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Create profile_images table
    await sql`
      CREATE TABLE IF NOT EXISTS profile_images (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        file_name VARCHAR(255),
        file_type VARCHAR(50),
        file_size INTEGER,
        storage_path VARCHAR(500),
        thumbnail_path VARCHAR(500),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Create user_preferences table
    await sql`
      CREATE TABLE IF NOT EXISTS user_preferences (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        location VARCHAR(255),
        linkedin VARCHAR(255),
        portfolio VARCHAR(255),
        job_alert_frequency VARCHAR(50) DEFAULT 'weekly',
        preferred_job_types TEXT[],
        remote_preference VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Create indexes
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);`
    await sql`CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);`
    await sql`CREATE INDEX IF NOT EXISTS idx_profile_images_user_id ON profile_images(user_id);`
    await sql`CREATE INDEX IF NOT EXISTS idx_profile_images_active ON profile_images(user_id, is_active);`

    // Create update_updated_at_column function and trigger
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `

    await sql`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
    `

    await sql`
      CREATE TRIGGER update_users_updated_at
          BEFORE UPDATE ON users
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `

    await sql`
      DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
    `

    await sql`
      CREATE TRIGGER update_user_preferences_updated_at
          BEFORE UPDATE ON user_preferences
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `

    console.log("Profile schema initialized successfully")
    return { success: true, dbAvailable: true }
  } catch (error) {
    console.error("Failed to initialize profile schema:", error)
    return { success: false, error, dbAvailable: false }
  }
}

// Create a mock user for testing
export async function createMockUser() {
  try {
    // Check if database is available
    const dbAvailable = await isDatabaseAvailable()
    if (!dbAvailable) {
      console.log("Database connection not available, skipping mock user creation")
      return { success: false, error: "Database connection not available", dbAvailable: false }
    }

    // Check if mock user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE id = '550e8400-e29b-41d4-a716-446655440000';
    `

    if (existingUser.rowCount > 0) {
      console.log("Mock user already exists")
      return { success: true, dbAvailable: true }
    }

    // Create mock user
    await sql`
      INSERT INTO users (
        id, first_name, last_name, email, phone, profile_image_url, created_at, updated_at
      ) VALUES (
        '550e8400-e29b-41d4-a716-446655440000', 'John', 'Doe', 'john@example.com', '(555) 123-4567', '/placeholder.svg?height=128&width=128', NOW(), NOW()
      );
    `

    // Create mock user preferences
    await sql`
      INSERT INTO user_preferences (
        user_id, location, linkedin, portfolio, job_alert_frequency, preferred_job_types, remote_preference, created_at, updated_at
      ) VALUES (
        '550e8400-e29b-41d4-a716-446655440000', 'San Francisco, CA', 'linkedin.com/in/johndoe', 'johndoe.com', 'weekly', ARRAY['full-time', 'contract'], 'hybrid', NOW(), NOW()
      );
    `

    console.log("Mock user created successfully")
    return { success: true, dbAvailable: true }
  } catch (error) {
    console.error("Failed to create mock user:", error)
    return { success: false, error, dbAvailable: false }
  }
}

// Initialize the profile database
export async function setupProfileDatabase() {
  try {
    // Check if database is available
    const dbAvailable = await isDatabaseAvailable()
    if (!dbAvailable) {
      console.log("Database connection not available, skipping profile database setup")
      return { success: false, error: "Database connection not available", dbAvailable: false }
    }

    await initializeProfileSchema()
    await createMockUser()
    return { success: true, dbAvailable: true }
  } catch (error) {
    console.error("Error setting up profile database:", error)
    return { success: false, error, dbAvailable: false }
  }
}
