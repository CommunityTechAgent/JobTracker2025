import { type NextRequest, NextResponse } from "next/server"
import { parseResume } from "@/lib/services/resume-parser"
import { revalidatePath } from "next/cache"
import { isDatabaseAvailable } from "@/lib/db/connection"

export async function POST(request: NextRequest) {
  try {
    const { resumeId, fileUrl, fileType } = await request.json()

    if (!resumeId || !fileUrl || !fileType) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Check if database is available
    const dbAvailable = await isDatabaseAvailable()
    console.log("Database available:", dbAvailable)

    // Parse the resume
    const result = await parseResume(resumeId, fileUrl, fileType)

    if (!result.success) {
      console.error("Resume parsing failed:", result.error)
      return NextResponse.json({ success: false, error: result.error || "Failed to parse resume" }, { status: 500 })
    }

    // Revalidate the resume page to show updated data
    revalidatePath("/resume")

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error("Error in parse route:", error)
    // Ensure we're returning a proper JSON response even in case of error
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}
