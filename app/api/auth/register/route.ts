import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"
import { supabaseAdmin } from "@/lib/supabase/server-client"

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    // Simple validation
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    // Step 1: Sign up the user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    })

    if (authError) {
      console.error("Auth error:", authError)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    // Step 2: Ensure user profile exists in Supabase 'users' table
    const { data: existingProfile, error: profileFetchError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("id", authData.user.id)
      .single()

    if (!existingProfile) {
      // Create user profile
      const { error: profileInsertError } = await supabaseAdmin.from("users").insert([
        {
          id: authData.user.id,
          email: authData.user.email,
          first_name: name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      if (profileInsertError) {
        console.error("Profile creation error:", profileInsertError)
        return NextResponse.json({ error: "Failed to create user profile" }, { status: 500 })
      }
    }

    // For development purposes, let's create a mock session
    // In production, the user would need to verify their email
    const mockSession = {
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: name,
      },
      expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
    }

    // Store the session in a cookie
    const response = NextResponse.json({
      success: true,
      message: "Account created successfully",
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: name,
      },
    })

    // Set a cookie with the session data
    response.cookies.set({
      name: "session",
      value: JSON.stringify(mockSession),
      httpOnly: true,
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sameSite: "lax",
    })

    return response
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
