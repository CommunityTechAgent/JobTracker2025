import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase/client"
import { profileExists } from "@/lib/services/profile-service"

// GET /api/profile/check - verify profile exists
export async function GET() {
  try {
    // Get user ID from session
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Please log in",
        },
        { status: 401 },
      )
    }

    // Check if profile exists
    const exists = await profileExists(userId)

    return NextResponse.json({
      success: true,
      exists,
    })
  } catch (error) {
    console.error("Error checking profile:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Helper function to get the current user ID
async function getCurrentUserId(): Promise<string | null> {
  try {
    // Check for session cookie
    const sessionId = cookies().get("session_id")?.value

    if (!sessionId) {
      console.log("No session ID found")

      // For development, return a mock user ID
      if (process.env.NODE_ENV === "development") {
        return "dev-user-" + Math.random().toString(36).substring(2, 15)
      }

      return null
    }

    // Try to use Supabase if available
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (!error && user) {
        return user.id
      }
    } catch (supabaseError) {
      console.error("Supabase error:", supabaseError)
    }

    // If we get here and it's development, return a mock user ID
    if (process.env.NODE_ENV === "development") {
      return "dev-user-" + Math.random().toString(36).substring(2, 15)
    }

    return null
  } catch (error) {
    console.error("Error getting current user ID:", error)
    return null
  }
}
