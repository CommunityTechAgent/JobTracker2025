import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getProfile } from "@/lib/services/profile-service"
import { isDatabaseAvailable, doesTableExist } from "@/lib/db"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    let session
    try {
      session = JSON.parse(sessionCookie.value)
    } catch (e) {
      return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 })
    }

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Check if users table exists
    const dbAvailable = await isDatabaseAvailable()
    if (dbAvailable) {
      const tableExists = await doesTableExist("users")

      if (!tableExists) {
        // Try to create the table
        try {
          const response = await fetch(new URL("/api/db/init-tables", request.url))
          if (!response.ok) {
            console.error("Failed to initialize tables:", await response.text())
          }
        } catch (e) {
          console.error("Error calling init-tables endpoint:", e)
        }
      }
    }

    const profile = await getProfile(userId)

    if (profile) {
      return NextResponse.json({ success: true, profile })
    } else {
      // If no profile found, return an empty profile
      return NextResponse.json({
        success: true,
        profile: {
          id: userId,
          firstName: "",
          lastName: "",
          email: session.user.email || "",
          phone: "",
          profileImageUrl: "",
        },
      })
    }
  } catch (error) {
    console.error("Error in profile get route:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}
