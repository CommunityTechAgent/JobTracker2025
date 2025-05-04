import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"
import { checkProfileTables } from "@/lib/db/migrations/profile-schema"

export async function GET() {
  try {
    // Check if database connection is available
    const { data, error } = await supabase.from("profiles").select("count").limit(1)

    if (error) {
      // Check if the error is because the table doesn't exist
      if (error.message.includes("does not exist")) {
        return NextResponse.json({
          initialized: false,
          error: "Database tables not initialized",
          details: "The profiles table does not exist",
        })
      }

      // Other database error
      return NextResponse.json({
        initialized: false,
        error: `Database error: ${error.message}`,
      })
    }

    // Check if all required tables exist
    const profileTablesCheck = await checkProfileTables()

    if (!profileTablesCheck.exists) {
      return NextResponse.json({
        initialized: false,
        error: `Missing table: ${profileTablesCheck.table}`,
      })
    }

    return NextResponse.json({
      initialized: true,
    })
  } catch (error) {
    console.error("Error checking database:", error)
    return NextResponse.json({
      initialized: false,
      error: error instanceof Error ? error.message : "Unknown database error",
    })
  }
}
