import { supabase, isSupabaseAvailable } from "./client"

// Initialize database schema for resumes
export async function initializeResumeSchema() {
  try {
    // Check if Supabase is available
    const supabaseAvailable = await isSupabaseAvailable()
    if (!supabaseAvailable) {
      console.log("Supabase connection not available, skipping schema initialization")
      return { success: false, error: "Supabase connection not available", supabaseAvailable: false }
    }

    // Instead of using exec RPC, we'll check if tables exist and report status
    console.log("Checking resume-related tables...")

    // Check if user_resumes table exists
    try {
      const { error: resumesError } = await supabase.from("user_resumes").select("count").limit(1)
      if (resumesError) {
        if (resumesError.message.includes("does not exist")) {
          console.log("user_resumes table doesn't exist. It needs to be created via migrations.")
        } else {
          console.error("Error checking user_resumes table:", resumesError)
        }
      } else {
        console.log("user_resumes table exists")
      }
    } catch (err) {
      console.error("Error checking user_resumes table:", err)
    }

    // Check if resume_parsed_content table exists
    try {
      const { error: parsedContentError } = await supabase.from("resume_parsed_content").select("count").limit(1)
      if (parsedContentError) {
        if (parsedContentError.message.includes("does not exist")) {
          console.log("resume_parsed_content table doesn't exist. It needs to be created via migrations.")
        } else {
          console.error("Error checking resume_parsed_content table:", parsedContentError)
        }
      } else {
        console.log("resume_parsed_content table exists")
      }
    } catch (err) {
      console.error("Error checking resume_parsed_content table:", err)
    }

    // Check if parsing_history table exists
    try {
      const { error: historyError } = await supabase.from("parsing_history").select("count").limit(1)
      if (historyError) {
        if (historyError.message.includes("does not exist")) {
          console.log("parsing_history table doesn't exist. It needs to be created via migrations.")
        } else {
          console.error("Error checking parsing_history table:", historyError)
        }
      } else {
        console.log("parsing_history table exists")
      }
    } catch (err) {
      console.error("Error checking parsing_history table:", err)
    }

    console.log("Resume schema check completed")
    return { success: true, supabaseAvailable: true }
  } catch (error) {
    console.error("Failed to check resume schema:", error)
    return { success: false, error, supabaseAvailable: true }
  }
}

// Initialize database schema for user profiles
export async function initializeProfileSchema() {
  try {
    // Check if Supabase is available
    const supabaseAvailable = await isSupabaseAvailable()
    if (!supabaseAvailable) {
      console.log("Supabase connection not available, skipping schema initialization")
      return { success: false, error: "Supabase connection not available", supabaseAvailable: false }
    }

    console.log("Checking profile-related tables...")

    // Check if users table exists
    try {
      const { error: usersError } = await supabase.from("users").select("count").limit(1)
      if (usersError) {
        if (usersError.message.includes("does not exist")) {
          console.log("users table doesn't exist. It needs to be created via migrations.")
        } else {
          console.error("Error checking users table:", usersError)
        }
      } else {
        console.log("users table exists")
      }
    } catch (err) {
      console.error("Error checking users table:", err)
    }

    // Check if profile_images table exists
    try {
      const { error: imagesError } = await supabase.from("profile_images").select("count").limit(1)
      if (imagesError) {
        if (imagesError.message.includes("does not exist")) {
          console.log("profile_images table doesn't exist. It needs to be created via migrations.")
        } else {
          console.error("Error checking profile_images table:", imagesError)
        }
      } else {
        console.log("profile_images table exists")
      }
    } catch (err) {
      console.error("Error checking profile_images table:", err)
    }

    // Check if user_preferences table exists
    try {
      const { error: prefsError } = await supabase.from("user_preferences").select("count").limit(1)
      if (prefsError) {
        if (prefsError.message.includes("does not exist")) {
          console.log("user_preferences table doesn't exist. It needs to be created via migrations.")
        } else {
          console.error("Error checking user_preferences table:", prefsError)
        }
      } else {
        console.log("user_preferences table exists")
      }
    } catch (err) {
      console.error("Error checking user_preferences table:", err)
    }

    console.log("Profile schema check completed")
    return { success: true, supabaseAvailable: true }
  } catch (error) {
    console.error("Failed to check profile schema:", error)
    return { success: false, error, supabaseAvailable: true }
  }
}

// Create a mock user for testing
export async function createMockUser() {
  try {
    // Check if Supabase is available
    const supabaseAvailable = await isSupabaseAvailable()
    if (!supabaseAvailable) {
      console.log("Supabase connection not available, skipping mock user creation")
      return { success: false, error: "Supabase connection not available", supabaseAvailable: false }
    }

    // Check if users table exists
    try {
      const { error: usersTableError } = await supabase.from("users").select("count").limit(1)
      if (usersTableError && usersTableError.message.includes("does not exist")) {
        console.log("Users table doesn't exist, cannot create mock user")
        return { success: false, error: "Users table doesn't exist", supabaseAvailable: true }
      }
    } catch (err) {
      console.error("Error checking users table:", err)
      return { success: false, error: err, supabaseAvailable: true }
    }

    // Check if mock user already exists
    try {
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("id", "550e8400-e29b-41d4-a716-446655440000")
        .single()

      if (checkError && !checkError.message.includes("No rows found")) {
        console.error("Error checking for existing user:", checkError)
      }

      if (existingUser) {
        console.log("Mock user already exists")
        return { success: true, supabaseAvailable: true }
      }
    } catch (err) {
      console.error("Error checking for existing user:", err)
    }

    // Create mock user using Supabase's upsert method
    try {
      const { error: userError } = await supabase.from("users").upsert({
        id: "550e8400-e29b-41d4-a716-446655440000",
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        phone: "(555) 123-4567",
        profile_image_url: "/placeholder.svg?height=128&width=128",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (userError) {
        console.error("Error creating mock user:", userError)
        return { success: false, error: userError, supabaseAvailable: true }
      }
    } catch (err) {
      console.error("Error creating mock user:", err)
      return { success: false, error: err, supabaseAvailable: true }
    }

    // Check if user_preferences table exists
    try {
      const { error: prefsTableError } = await supabase.from("user_preferences").select("count").limit(1)
      if (prefsTableError && !prefsTableError.message.includes("does not exist")) {
        // Create mock user preferences only if the table exists
        try {
          const { error: prefError } = await supabase.from("user_preferences").upsert({
            user_id: "550e8400-e29b-41d4-a716-446655440000",
            location: "San Francisco, CA",
            linkedin: "linkedin.com/in/johndoe",
            portfolio: "johndoe.com",
            job_alert_frequency: "weekly",
            preferred_job_types: ["full-time", "contract"],
            remote_preference: "hybrid",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (prefError) {
            console.error("Error creating mock user preferences:", prefError)
            // Continue even if preferences creation fails
          }
        } catch (err) {
          console.error("Error creating mock user preferences:", err)
        }
      }
    } catch (err) {
      console.error("Error checking user_preferences table:", err)
    }

    console.log("Mock user creation attempted")
    return { success: true, supabaseAvailable: true }
  } catch (error) {
    console.error("Failed to create mock user:", error)
    return { success: false, error, supabaseAvailable: true }
  }
}

// Initialize the entire database
export async function setupDatabase() {
  try {
    // Check if Supabase is available
    const supabaseAvailable = await isSupabaseAvailable()
    if (!supabaseAvailable) {
      console.log("Supabase connection not available, skipping setup")
      return { success: false, error: "Supabase connection not available", supabaseAvailable: false }
    }

    console.log("Starting database setup...")

    // Initialize tables in parallel for better performance
    const [resumeSchema, profileSchema, mockUser] = await Promise.all([
      initializeResumeSchema(),
      initializeProfileSchema(),
      createMockUser()
    ])

    // If any of the operations failed, return the first error
    if (!resumeSchema.success) {
      return resumeSchema
    }
    if (!profileSchema.success) {
      return profileSchema
    }
    if (!mockUser.success) {
      return mockUser
    }

    return { success: true, supabaseAvailable: true }
  } catch (error) {
    console.error("Error setting up database:", error)
    return { success: false, error, supabaseAvailable: true }
  }
}

// Fallback method for database setup when tables don't exist
export async function setupDatabaseFallback() {
  try {
    console.log("Using fallback method for database setup")
    return {
      success: true,
      message: "Database setup attempted with fallback method. Using mock data.",
      supabaseAvailable: true,
    }
  } catch (error) {
    console.error("Error in database fallback setup:", error)
    return {
      success: false,
      error,
      message: "Failed to set up database with fallback method",
      supabaseAvailable: true,
    }
  }
}
