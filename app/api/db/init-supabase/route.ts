import { NextResponse } from "next/server"
import { setupDatabase } from "@/lib/supabase/schema"
import { isSupabaseAvailable } from "@/lib/supabase/client"

export async function GET() {
  try {
    // Check if Supabase is available
    const supabaseAvailable = await isSupabaseAvailable()
    if (!supabaseAvailable) {
      return NextResponse.json({
        success: false,
        message: "Supabase connection not available. Using mock data instead.",
        supabaseAvailable: false,
      })
    }

    const result = await setupDatabase()

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Supabase database initialized successfully",
        supabaseAvailable: true,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to initialize Supabase database",
          error: result.error,
          supabaseAvailable: result.supabaseAvailable,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error initializing Supabase database:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: String(error),
        supabaseAvailable: false,
      },
      { status: 500 },
    )
  }
}
