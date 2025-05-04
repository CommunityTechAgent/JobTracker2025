import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

export async function GET() {
  try {
    console.log("Initializing users table...")

    // Check if the users table exists
    const { error: checkError } = await supabase
      .from("users")
      .select("id")
      .limit(1)
      .catch((err) => {
        // This will catch the error if the table doesn't exist
        return { error: err }
      })

    // If there's no error, the table exists
    if (!checkError) {
      console.log("Users table already exists")
      return NextResponse.json({ success: true, message: "Users table already exists" })
    }

    // Create the users table
    const { error: createError } = await supabase
      .rpc("exec", {
        query: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY,
          name VARCHAR(255),
          email VARCHAR(255) UNIQUE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `,
      })
      .catch((err) => {
        console.error("Error creating users table:", err)
        return { error: err }
      })

    if (createError) {
      console.error("Failed to create users table:", createError)
      return NextResponse.json(
        {
          success: false,
          error: createError.message || "Failed to create users table",
        },
        { status: 500 },
      )
    }

    console.log("Users table created successfully")
    return NextResponse.json({ success: true, message: "Users table created successfully" })
  } catch (error) {
    console.error("Error initializing users table:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
