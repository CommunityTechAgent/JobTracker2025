import { v4 as uuidv4 } from "uuid"
import { supabase, isSupabaseAvailable } from "@/lib/supabase/client"

export interface ResumeRecord {
  id: string
  user_id: string
  file_name: string
  file_type: string
  file_size: number
  file_storage_path: string
  is_active: boolean
  upload_timestamp: Date
  parse_status: string
  parse_timestamp: Date | null
  created_at: Date
  updated_at: Date
}

export interface ParsedContent {
  id: string
  resume_id: string
  contact_info: any
  work_experience: any
  education: any
  skills: any
  certifications: any
  raw_text: string
  ats_score: number | null
  parsing_metadata: any
  created_at: Date
}

export interface ParsingHistory {
  id: string
  resume_id: string
  parser_version: string
  parsing_status: string
  error_message: string | null
  processing_time_ms: number
  created_at: Date
}

// Mock data for when database is not available
const mockResumeData: ResumeRecord = {
  id: "mock-resume-id",
  user_id: "550e8400-e29b-41d4-a716-446655440000",
  file_name: "mock-resume.pdf",
  file_type: "application/pdf",
  file_size: 1024 * 1024, // 1MB
  file_storage_path: "/placeholder.svg?height=500&width=400",
  is_active: true,
  upload_timestamp: new Date(),
  parse_status: "completed",
  parse_timestamp: new Date(),
  created_at: new Date(),
  updated_at: new Date(),
}

const mockParsedContent: ParsedContent = {
  id: "mock-parsed-content-id",
  resume_id: "mock-resume-id",
  contact_info: {
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "(555) 123-4567",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/johndoe",
  },
  work_experience: [
    {
      title: "Senior Frontend Developer",
      company: "TechCorp Inc.",
      location: "San Francisco, CA",
      startDate: "Jan 2020",
      endDate: "Present",
      description: [
        "Led development of the company's main product dashboard using React and TypeScript",
        "Improved application performance by 40% through code optimization and lazy loading",
        "Mentored junior developers and conducted code reviews",
      ],
    },
    {
      title: "Frontend Developer",
      company: "WebSolutions",
      location: "San Francisco, CA",
      startDate: "Mar 2018",
      endDate: "Dec 2019",
      description: [
        "Developed and maintained client websites using React and Redux",
        "Implemented responsive designs ensuring cross-browser compatibility",
        "Collaborated with UX designers to create intuitive user interfaces",
      ],
    },
  ],
  education: [
    {
      degree: "Bachelor of Science in Computer Science",
      institution: "University of California, Berkeley",
      location: "Berkeley, CA",
      startDate: "Sep 2014",
      endDate: "May 2018",
    },
  ],
  skills: ["JavaScript", "TypeScript", "React", "Next.js", "HTML", "CSS", "Tailwind CSS", "Node.js", "Git"],
  certifications: [],
  raw_text: "Mock resume text content",
  ats_score: 85,
  parsing_metadata: { parserVersion: "1.0.0" },
  created_at: new Date(),
}

// Create a new resume record
export async function createResumeRecord(
  userId: string,
  fileName: string,
  fileType: string,
  fileSize: number,
  filePath: string,
  isActive = false,
): Promise<ResumeRecord | null> {
  try {
    // Check if database is available
    const dbAvailable = await isSupabaseAvailable()
    if (!dbAvailable) {
      console.log("Database not available, returning mock resume data")
      return {
        ...mockResumeData,
        id: uuidv4(),
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        file_storage_path: filePath,
      }
    }

    const id = uuidv4()
    const now = new Date()

    const { data, error } = await supabase
      .from("user_resumes")
      .insert({
        id,
        user_id: userId,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        file_storage_path: filePath,
        is_active: isActive,
        upload_timestamp: now.toISOString(),
        parse_status: "pending",
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Failed to create resume record:", error)
      return null
    }

    // Convert string dates to Date objects
    return {
      ...data,
      upload_timestamp: new Date(data.upload_timestamp),
      parse_timestamp: data.parse_timestamp ? new Date(data.parse_timestamp) : null,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    } as ResumeRecord
  } catch (error) {
    console.error("Failed to create resume record:", error)
    return null
  }
}

// Get all resumes for a user
export async function getUserResumes(userId: string): Promise<ResumeRecord[]> {
  try {
    // Check if database is available
    const dbAvailable = await isSupabaseAvailable()
    if (!dbAvailable) {
      console.log("Database not available, returning mock resume data")
      return [mockResumeData]
    }

    const { data, error } = await supabase
      .from("user_resumes")
      .select("*")
      .eq("user_id", userId)
      .order("upload_timestamp", { ascending: false })

    if (error) {
      console.error("Failed to get user resumes:", error)
      return []
    }

    // Convert string dates to Date objects
    return data.map((resume) => ({
      ...resume,
      upload_timestamp: new Date(resume.upload_timestamp),
      parse_timestamp: resume.parse_timestamp ? new Date(resume.parse_timestamp) : null,
      created_at: new Date(resume.created_at),
      updated_at: new Date(resume.updated_at),
    })) as ResumeRecord[]
  } catch (error) {
    console.error("Failed to get user resumes:", error)
    return []
  }
}

// Get a user's active resume
export async function getUserActiveResume(userId: string): Promise<ResumeRecord | null> {
  try {
    // Check if database is available
    const dbAvailable = await isSupabaseAvailable()
    if (!dbAvailable) {
      console.log("Database not available, returning mock resume data")
      return mockResumeData
    }

    const { data, error } = await supabase
      .from("user_resumes")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .limit(1)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // No active resume found
        return null
      }
      console.error("Failed to get active resume:", error)
      return null
    }

    if (!data) {
      return null
    }

    // Convert string dates to Date objects
    return {
      ...data,
      upload_timestamp: new Date(data.upload_timestamp),
      parse_timestamp: data.parse_timestamp ? new Date(data.parse_timestamp) : null,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    } as ResumeRecord
  } catch (error) {
    console.error("Failed to get active resume:", error)
    return null
  }
}

// Set a resume as active
export async function setResumeActive(resumeId: string, userId: string): Promise<boolean> {
  try {
    // Check if database is available
    const dbAvailable = await isSupabaseAvailable()
    if (!dbAvailable) {
      console.log("Database not available, returning mock success")
      return true
    }

    // First, set all resumes for this user as inactive
    const { error: updateError } = await supabase
      .from("user_resumes")
      .update({ is_active: false })
      .eq("user_id", userId)

    if (updateError) {
      console.error("Failed to update resumes:", updateError)
      return false
    }

    // Then set the specified resume as active
    const { error } = await supabase
      .from("user_resumes")
      .update({ is_active: true })
      .eq("id", resumeId)
      .eq("user_id", userId)

    if (error) {
      console.error("Failed to set resume as active:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Failed to set resume as active:", error)
    return false
  }
}

// Delete a resume
export async function deleteResume(resumeId: string, userId: string): Promise<boolean> {
  try {
    // Check if database is available
    const dbAvailable = await isSupabaseAvailable()
    if (!dbAvailable) {
      console.log("Database not available, returning mock success")
      return true
    }

    // First check if this is the active resume
    const { data, error: checkError } = await supabase
      .from("user_resumes")
      .select("is_active")
      .eq("id", resumeId)
      .eq("user_id", userId)
      .single()

    if (checkError) {
      console.error("Failed to check resume:", checkError)
      return false
    }

    // Delete related records first (Supabase doesn't automatically cascade deletes)
    const { error: historyError } = await supabase.from("parsing_history").delete().eq("resume_id", resumeId)

    if (historyError) {
      console.error("Failed to delete parsing history:", historyError)
      // Continue anyway
    }

    const { error: contentError } = await supabase.from("resume_parsed_content").delete().eq("resume_id", resumeId)

    if (contentError) {
      console.error("Failed to delete parsed content:", contentError)
      // Continue anyway
    }

    // Then delete the resume
    const { error } = await supabase.from("user_resumes").delete().eq("id", resumeId).eq("user_id", userId)

    if (error) {
      console.error("Failed to delete resume:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Failed to delete resume:", error)
    return false
  }
}

// Create parsed content for a resume
export async function createParsedContent(
  resumeId: string,
  contactInfo: any,
  workExperience: any,
  education: any,
  skills: any,
  certifications: any,
  rawText: string,
  atsScore: number | null = null,
  parsingMetadata: any = {},
): Promise<ParsedContent | null> {
  try {
    // Check if database is available
    const dbAvailable = await isSupabaseAvailable()
    if (!dbAvailable) {
      console.log("Database not available, returning mock parsed content")
      return { ...mockParsedContent, resume_id: resumeId }
    }

    const id = uuidv4()
    const now = new Date()

    // First, check if parsed content already exists for this resume
    const { data: existingData, error: checkError } = await supabase
      .from("resume_parsed_content")
      .select("id")
      .eq("resume_id", resumeId)
      .single()

    // If parsed content exists, update it
    if (existingData) {
      const { data, error } = await supabase
        .from("resume_parsed_content")
        .update({
          contact_info: contactInfo,
          work_experience: workExperience,
          education: education,
          skills: skills,
          certifications: certifications,
          raw_text: rawText,
          ats_score: atsScore,
          parsing_metadata: parsingMetadata,
        })
        .eq("id", existingData.id)
        .select()
        .single()

      if (error) {
        console.error("Failed to update parsed content:", error)
        return null
      }

      // Update the resume's parse status and timestamp
      await supabase
        .from("user_resumes")
        .update({
          parse_status: "completed",
          parse_timestamp: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", resumeId)

      // Convert string dates to Date objects
      return {
        ...data,
        created_at: new Date(data.created_at),
      } as ParsedContent
    }

    // If no existing parsed content, create new
    const { data, error } = await supabase
      .from("resume_parsed_content")
      .insert({
        id,
        resume_id: resumeId,
        contact_info: contactInfo,
        work_experience: workExperience,
        education: education,
        skills: skills,
        certifications: certifications,
        raw_text: rawText,
        ats_score: atsScore,
        parsing_metadata: parsingMetadata,
        created_at: now.toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Failed to create parsed content:", error)
      return null
    }

    // Update the resume's parse status and timestamp
    await supabase
      .from("user_resumes")
      .update({
        parse_status: "completed",
        parse_timestamp: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", resumeId)

    // Convert string dates to Date objects
    return {
      ...data,
      created_at: new Date(data.created_at),
    } as ParsedContent
  } catch (error) {
    console.error("Failed to create parsed content:", error)
    return null
  }
}

// Get parsed content for a resume
export async function getParsedContent(resumeId: string): Promise<ParsedContent | null> {
  try {
    // Check if database is available
    const dbAvailable = await isSupabaseAvailable()
    if (!dbAvailable) {
      console.log("Database not available, returning mock parsed content")
      return mockParsedContent
    }

    const { data, error } = await supabase.from("resume_parsed_content").select("*").eq("resume_id", resumeId).single()

    if (error) {
      if (error.code === "PGRST116") {
        // No parsed content found
        return null
      }
      console.error("Failed to get parsed content:", error)
      return null
    }

    // Convert string dates to Date objects
    return {
      ...data,
      created_at: new Date(data.created_at),
    } as ParsedContent
  } catch (error) {
    console.error("Failed to get parsed content:", error)
    return null
  }
}

// Record parsing history
export async function recordParsingHistory(
  resumeId: string,
  parserVersion: string,
  parsingStatus: string,
  errorMessage: string | null = null,
  processingTimeMs: number,
): Promise<ParsingHistory | null> {
  try {
    // Check if database is available
    const dbAvailable = await isSupabaseAvailable()
    if (!dbAvailable) {
      console.log("Database not available, skipping parsing history")
      return null
    }

    const id = uuidv4()
    const now = new Date()

    const { data, error } = await supabase
      .from("parsing_history")
      .insert({
        id,
        resume_id: resumeId,
        parser_version: parserVersion,
        parsing_status: parsingStatus,
        error_message: errorMessage,
        processing_time_ms: processingTimeMs,
        created_at: now.toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Failed to record parsing history:", error)
      return null
    }

    // Convert string dates to Date objects
    return {
      ...data,
      created_at: new Date(data.created_at),
    } as ParsingHistory
  } catch (error) {
    console.error("Failed to record parsing history:", error)
    return null
  }
}

// Get parsing history for a resume
export async function getParsingHistory(resumeId: string): Promise<ParsingHistory[]> {
  try {
    // Check if database is available
    const dbAvailable = await isSupabaseAvailable()
    if (!dbAvailable) {
      console.log("Database not available, returning empty parsing history")
      return []
    }

    const { data, error } = await supabase
      .from("parsing_history")
      .select("*")
      .eq("resume_id", resumeId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to get parsing history:", error)
      return []
    }

    // Convert string dates to Date objects
    return data.map((history) => ({
      ...history,
      created_at: new Date(history.created_at),
    })) as ParsingHistory[]
  } catch (error) {
    console.error("Failed to get parsing history:", error)
    return []
  }
}
