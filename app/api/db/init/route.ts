import { NextResponse } from "next/server"
import { getDB, isDatabaseAvailable } from "@/lib/db"
import { setupDatabase } from "@/lib/db/schema"

export async function GET() {
  try {
    // Check if database is available
    const dbAvailable = await isDatabaseAvailable()
    if (!dbAvailable) {
      return NextResponse.json(
        {
          success: false,
          message: "Database connection not available.",
          dbAvailable: false,
        },
        { status: 503 },
      )
    }

    // Get database connection
    const db = getDB()

    // Setup database tables
    const result = await setupDatabase(db)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Database initialized successfully",
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to initialize database",
          dbAvailable: result.dbAvailable,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error initializing database:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 },
    )
  }
}
