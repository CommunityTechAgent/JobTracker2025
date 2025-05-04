import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    // Get session cookie
    const sessionCookie = cookies().get("session")

    if (!sessionCookie || !sessionCookie.value) {
      console.log("No session cookie found")
      return NextResponse.json({ user: null }, { status: 200 })
    }

    try {
      const session = JSON.parse(sessionCookie.value)

      // Check if session is expired
      if (session.expires_at && session.expires_at < Date.now()) {
        console.log("Session expired")
        return NextResponse.json({ user: null }, { status: 200 })
      }

      return NextResponse.json({ user: session.user }, { status: 200 })
    } catch (parseError) {
      console.error("Failed to parse session cookie:", parseError)
      return NextResponse.json({ user: null, error: "Invalid session format" }, { status: 200 })
    }
  } catch (error) {
    console.error("Session error:", error)
    return NextResponse.json({ user: null, error: "Internal server error" }, { status: 200 })
  }
}
