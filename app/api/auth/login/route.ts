import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // Simple validation
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Check for demo user - FIXED to match login page credentials
    if (email === "john@example.com" && password === "password123") {
      const mockSession = {
        user: {
          id: "demo-user-id",
          email: "john@example.com",
          name: "John Doe",
        },
        expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
      }

      const response = NextResponse.json({
        success: true,
        user: mockSession.user,
      })

      response.cookies.set({
        name: "session",
        value: JSON.stringify(mockSession),
        httpOnly: true,
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        sameSite: "lax",
      })

      return response
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Login error:", error.message)
      return NextResponse.json({ error: error.message || "Invalid email or password" }, { status: 401 })
    }

    if (!data.user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Step: Ensure user profile exists in Supabase 'users' table
    const { data: existingProfile, error: profileFetchError } = await supabase
      .from("users")
      .select("id")
      .eq("id", data.user.id)
      .single()

    if (!existingProfile) {
      // Only create profile if email is defined
      if (data.user.email) {
        const { error: profileInsertError } = await supabase.from("users").insert([
          {
            id: data.user.id,
            email: data.user.email,
            first_name: data.user.user_metadata?.name || data.user.email.split("@")[0] || "User",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        if (profileInsertError) {
          console.error("Profile creation error:", profileInsertError)
          // Don't block login, just log the error
        }
      }
    }

    // Create session without trying to fetch from users table
    // This avoids the "relation 'public.users' does not exist" error
    const session = {
      user: {
        id: data.user.id,
        email: data.user.email || "",
        name: data.user.user_metadata?.name || (data.user.email ? data.user.email.split("@")[0] : "User") || "User",
      },
      expires_at: data.session && data.session.expires_at ? new Date(data.session.expires_at).getTime() : Date.now() + 7 * 24 * 60 * 60 * 1000,
    }

    const response = NextResponse.json({
      success: true,
      user: session.user,
    })

    response.cookies.set({
      name: "session",
      value: JSON.stringify(session),
      httpOnly: true,
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sameSite: "lax",
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
