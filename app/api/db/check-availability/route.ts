import { isSupabaseAvailable } from "@/lib/supabase/client"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const available = await isSupabaseAvailable()

    return NextResponse.json({
      available,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error checking Supabase availability:", error)

    return NextResponse.json(
      {
        available: false,
        error: error instanceof Error ? error.message : "Unknown error checking Supabase availability",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
