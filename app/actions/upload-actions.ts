"use server"

import { put, del } from "@vercel/blob"
import { revalidatePath } from "next/cache"
import { createResumeRecord, setResumeActive, deleteResume } from "@/lib/db/resume-service"
import { isDatabaseAvailable, getMockUserId } from "@/lib/db/connection"
import { v4 as uuidv4 } from "uuid"

// Mock user ID - in a real app, this would come from authentication
const MOCK_USER_ID = getMockUserId()

export async function uploadResume(formData: FormData) {
  try {
    const file = formData.get("file") as File

    if (!file) {
      return { success: false, error: "No file provided" }
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ]
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "Invalid file type. Please upload a PDF, DOCX, or TXT file." }
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "File too large. Maximum size is 5MB." }
    }

    // Generate a unique filename
    const timestamp = Date.now()
    const filename = `resumes/${timestamp}-${file.name.replace(/\s+/g, "-")}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public", // Using public access as required by Vercel Blob
      addRandomSuffix: true,
    })

    // Check if database is available
    const dbAvailable = await isDatabaseAvailable()
    let resumeId = uuidv4() // Generate a UUID regardless of DB availability

    if (dbAvailable) {
      // Create a record in the database
      const resume = await createResumeRecord(
        MOCK_USER_ID,
        file.name,
        file.type,
        file.size,
        blob.url,
        true, // Set as active by default
      )

      if (resume) {
        resumeId = resume.id
      } else {
        // If database insert fails, delete the blob to avoid orphaned files
        await del(blob.url)
        return { success: false, error: "Failed to create resume record in database" }
      }
    } else {
      console.log("Database not available, proceeding with mock resume ID")
    }

    // Return success with the blob URL and resume ID
    revalidatePath("/resume")
    return {
      success: true,
      url: blob.url,
      filename: blob.pathname,
      contentType: file.type,
      size: file.size,
      resumeId: resumeId,
    }
  } catch (error) {
    console.error("Error uploading file:", error)
    return { success: false, error: "Failed to upload file. Please try again." }
  }
}

export async function uploadProfilePicture(formData: FormData) {
  try {
    const file = formData.get("file") as File

    if (!file) {
      return { success: false, error: "No file provided" }
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "Invalid file type. Please upload a JPG, PNG, or WebP image." }
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      return { success: false, error: "File too large. Maximum size is 2MB." }
    }

    // Generate a unique filename
    const timestamp = Date.now()
    const filename = `profile-pictures/${timestamp}-${file.name.replace(/\s+/g, "-")}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public", // Profile pictures can be public
      addRandomSuffix: true,
    })

    // Return success with the blob URL
    revalidatePath("/")
    return {
      success: true,
      url: blob.url,
      filename: blob.pathname,
    }
  } catch (error) {
    console.error("Error uploading file:", error)
    return { success: false, error: "Failed to upload file. Please try again." }
  }
}

export async function deleteResumeFile(resumeId: string) {
  try {
    // Check if database is available
    const dbAvailable = await isDatabaseAvailable()

    if (dbAvailable) {
      // Get the resume record to find the file path
      const deleted = await deleteResume(resumeId, MOCK_USER_ID)

      if (!deleted) {
        return { success: false, error: "Failed to delete resume" }
      }
    } else {
      console.log("Database not available, proceeding with mock delete")
    }

    revalidatePath("/resume")
    return { success: true }
  } catch (error) {
    console.error("Error deleting resume:", error)
    return { success: false, error: "Failed to delete resume. Please try again." }
  }
}

export async function setActiveResume(resumeId: string) {
  try {
    // Check if database is available
    const dbAvailable = await isDatabaseAvailable()

    if (dbAvailable) {
      const success = await setResumeActive(resumeId, MOCK_USER_ID)

      if (!success) {
        return { success: false, error: "Failed to set resume as active" }
      }
    } else {
      console.log("Database not available, proceeding with mock active resume")
    }

    revalidatePath("/resume")
    return { success: true }
  } catch (error) {
    console.error("Error setting active resume:", error)
    return { success: false, error: "Failed to set resume as active. Please try again." }
  }
}
