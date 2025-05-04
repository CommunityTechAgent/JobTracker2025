import { NextResponse } from "next/server"
import { initAuthTables } from "@/lib/supabase/init-auth"

export async function GET() {
  try {
    const result = await initAuthTables()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error initializing auth tables:", error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
