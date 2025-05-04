import { NextResponse } from "next/server"
import { setupProfileDatabase } from "@/lib/db/profile-schema"
import { isDatabaseAvailable } from "@/lib/db/connection"

export async function GET() {
  try {
    // Check if database is available
    const dbAvailable = await isDatabaseAvailable()
    if (!dbAvailable) {
      return NextResponse.json({
        success: false,
        message: "Database connection not available. Using mock data instead.",
        dbAvailable: false,
      })
    }

    const result = await setupProfileDatabase()

    if (result.success) {
      return NextResponse.json({ success: true, message: "Profile database initialized successfully" })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to initialize profile database",
          dbAvailable: result.dbAvailable,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error initializing profile database:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
