import { NextResponse } from "next/server"
import { setupDatabase } from "@/lib/supabase/schema"
import { isSupabaseAvailable } from "@/lib/supabase/client"

export async function GET() {
  try {
    // Check if Supabase is available
    const supabaseAvailable = await isSupabaseAvailable()

    if (!supabaseAvailable) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase connection not available",
          message: "Could not connect to Supabase. Please check your environment variables.",
        },
        { status: 503 },
      )
    }

    // Initialize the database
    try {
      const result = await setupDatabase()

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: "Database initialized successfully",
        })
      } else {
        return NextResponse.json(
          {
            success: false,
            error: result.error,
            message: "Failed to initialize database",
          },
          { status: 500 },
        )
      }
    } catch (error) {
      console.error("Error in database initialization:", error)
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          message: "Exception during database initialization",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Unexpected error in init-database route:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Unexpected error occurred",
      },
      { status: 500 },
    )
  }
}
