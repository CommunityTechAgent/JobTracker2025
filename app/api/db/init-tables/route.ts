import { NextResponse } from "next/server"
import { getDB, isDatabaseAvailable } from "@/lib/db"

export async function GET() {
  try {
    // Check if database is available
    const dbAvailable = await isDatabaseAvailable()
    if (!dbAvailable) {
      console.error("Database connection not available")
      return NextResponse.json({ success: false, error: "Database connection not available" }, { status: 503 })
    }

    const db = getDB()
    console.log("Database connection established, creating tables...")

    // Create users table
    try {
      console.log("Creating users table...")
      await db.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY,
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          email VARCHAR(255) UNIQUE NOT NULL,
          phone VARCHAR(20),
          profile_image_url VARCHAR(500),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)
      console.log("Users table created successfully")
    } catch (error) {
      console.error("Error creating users table:", error)
      return NextResponse.json(
        { success: false, error: `Error creating users table: ${error.message}` },
        { status: 500 },
      )
    }

    // Create user_preferences table - without foreign key constraint for now
    try {
      console.log("Creating user_preferences table...")
      await db.query(`
        CREATE TABLE IF NOT EXISTS user_preferences (
          user_id UUID PRIMARY KEY,
          location VARCHAR(255),
          linkedin VARCHAR(255),
          portfolio VARCHAR(255),
          job_alert_frequency VARCHAR(50) DEFAULT 'weekly',
          preferred_job_types TEXT[],
          remote_preference VARCHAR(50),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)
      console.log("User preferences table created successfully")
    } catch (error) {
      console.error("Error creating user_preferences table:", error)
      // Continue even if this fails
    }

    // Create profile_images table - without foreign key constraint for now
    try {
      console.log("Creating profile_images table...")
      await db.query(`
        CREATE TABLE IF NOT EXISTS profile_images (
          id UUID PRIMARY KEY,
          user_id UUID,
          file_name VARCHAR(255),
          file_type VARCHAR(50),
          file_size INTEGER,
          storage_path VARCHAR(500),
          thumbnail_path VARCHAR(500),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)
      console.log("Profile images table created successfully")
    } catch (error) {
      console.error("Error creating profile_images table:", error)
      // Continue even if this fails
    }

    return NextResponse.json({
      success: true,
      message: "Tables created successfully",
    })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}
