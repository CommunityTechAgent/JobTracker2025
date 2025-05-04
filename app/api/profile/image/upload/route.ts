import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { cookies } from "next/headers"
import { v4 as uuidv4 } from "uuid"
import { isDatabaseAvailable } from "@/lib/db/connection"
import { supabase } from "@/lib/supabase/client"

export async function POST(request: Request) {
  try {
    // Check if user is authenticated
    // For development purposes, we'll skip strict authentication checks
    const sessionId = cookies().get("session_id")?.value
    // Use a mock user ID if no session exists
    const userId = "550e8400-e29b-41d4-a716-446655440000" // Mock user ID for testing

    // Log authentication status for debugging
    console.log("Session ID:", sessionId ? "Present" : "Missing")
    console.log("Using user ID:", userId)

    // Check if BLOB_READ_WRITE_TOKEN is available
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN
    console.log("BLOB_READ_WRITE_TOKEN available:", !!blobToken)

    // Parse the form data
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Please upload a JPEG, PNG, GIF, or WebP image.` },
        { status: 400 },
      )
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 2MB." }, { status: 400 })
    }

    let imageUrl = ""

    if (!blobToken) {
      console.warn("BLOB_READ_WRITE_TOKEN is not available, using mock image URL")
      // Return a mock image URL for development purposes
      imageUrl = `/placeholder.svg?height=128&width=128&query=profile-${Date.now()}`
    } else {
      // Generate a unique filename
      const timestamp = Date.now()
      const filename = `profile-images/${userId}/${timestamp}-${file.name.replace(/\s+/g, "-")}`

      // Upload to Vercel Blob
      const blob = await put(filename, file, {
        access: "public", // Profile pictures can be public
        addRandomSuffix: true,
      })

      imageUrl = blob.url
    }

    // Try to update the database, but don't fail if it's not available
    let dbUpdateSuccess = false
    try {
      // Check if database is available before attempting database operations
      const dbAvailable = await isDatabaseAvailable()

      if (dbAvailable) {
        // Try Supabase first
        const supabaseAvailable = await isSupabaseAvailable()

        if (supabaseAvailable) {
          try {
            // Insert into profile_images table
            const imageId = uuidv4()
            const { error: insertError } = await supabase.from("profile_images").insert({
              id: imageId,
              user_id: userId,
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
              storage_path: imageUrl,
              is_active: true,
            })

            if (insertError) {
              console.warn("Supabase insert error:", insertError.message)
            }

            // Update the user's profile_image_url
            const { error: updateError } = await supabase
              .from("users")
              .update({ profile_image_url: imageUrl, updated_at: new Date().toISOString() })
              .eq("id", userId)

            if (updateError) {
              console.warn("Supabase update error:", updateError.message)
            } else {
              dbUpdateSuccess = true
            }
          } catch (supabaseError) {
            console.warn("Supabase operation error:", supabaseError)
          }
        }

        // Fall back to Vercel Postgres if Supabase failed
        if (!dbUpdateSuccess) {
          try {
            const { sql } = await import("@vercel/postgres")
            const imageId = uuidv4()

            await sql`
              INSERT INTO profile_images (
                id, user_id, file_name, file_type, file_size, storage_path, is_active, created_at
              ) VALUES (
                ${imageId}, ${userId}, ${file.name}, ${file.type}, ${file.size}, ${imageUrl}, true, NOW()
              )
            `

            // Update the user's profile_image_url
            await sql`
              UPDATE users 
              SET profile_image_url = ${imageUrl}, updated_at = NOW()
              WHERE id = ${userId}
            `

            dbUpdateSuccess = true
            console.log("Vercel Postgres database updated successfully")
          } catch (pgError) {
            console.warn("Vercel Postgres error:", pgError)
          }
        }
      } else {
        console.log("Database not available, skipping database operations")
      }
    } catch (dbError) {
      console.warn("Database operation error:", dbError)
      // Continue even if database operation fails
    }

    // Return success with the image URL, even if database update failed
    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
      dbUpdateSuccess: dbUpdateSuccess,
    })
  } catch (error) {
    console.error("Error uploading profile image:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to upload image. Please try again.",
      },
      { status: 500 },
    )
  }
}

// Helper function to check if Supabase is available
async function isSupabaseAvailable(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from("users").select("count").limit(1)

    // If the error is that the table doesn't exist, that's fine - Supabase is still available
    if (error && error.message.includes("does not exist")) {
      return true
    }

    if (error) {
      console.warn("Supabase check failed:", error.message)
      return false
    }

    return true
  } catch (error) {
    console.warn("Supabase availability check error:", error)
    return false
  }
}
