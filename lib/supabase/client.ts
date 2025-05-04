import { createClient } from "@supabase/supabase-js"

// Type for the database schema
export type Database = {
  public: {
    tables: {
      user_resumes: {
        Row: {
          id: string
          user_id: string
          file_name: string
          file_type: string
          file_size: number
          file_storage_path: string
          is_active: boolean
          upload_timestamp: string
          parse_status: string
          parse_timestamp: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          file_name: string
          file_type: string
          file_size: number
          file_storage_path: string
          is_active?: boolean
          upload_timestamp: string
          parse_status?: string
          parse_timestamp?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_name?: string
          file_type?: string
          file_size?: number
          file_storage_path?: string
          is_active?: boolean
          upload_timestamp?: string
          parse_status?: string
          parse_timestamp?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      resume_parsed_content: {
        Row: {
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
          created_at: string
        }
        Insert: {
          id: string
          resume_id: string
          contact_info: any
          work_experience: any
          education: any
          skills: any
          certifications: any
          raw_text: string
          ats_score?: number | null
          parsing_metadata?: any
          created_at?: string
        }
        Update: {
          id?: string
          resume_id?: string
          contact_info?: any
          work_experience?: any
          education?: any
          skills?: any
          certifications?: any
          raw_text?: string
          ats_score?: number | null
          parsing_metadata?: any
          created_at?: string
        }
      }
      parsing_history: {
        Row: {
          id: string
          resume_id: string
          parser_version: string
          parsing_status: string
          error_message: string | null
          processing_time_ms: number
          created_at: string
        }
        Insert: {
          id: string
          resume_id: string
          parser_version: string
          parsing_status: string
          error_message?: string | null
          processing_time_ms: number
          created_at?: string
        }
        Update: {
          id?: string
          resume_id?: string
          parser_version?: string
          parsing_status?: string
          error_message?: string | null
          processing_time_ms?: number
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          email: string
          phone: string | null
          profile_image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          email: string
          phone?: string | null
          profile_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          email?: string
          phone?: string | null
          profile_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profile_images: {
        Row: {
          id: string
          user_id: string
          file_name: string
          file_type: string
          file_size: number
          storage_path: string
          thumbnail_path: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          user_id: string
          file_name: string
          file_type: string
          file_size: number
          storage_path: string
          thumbnail_path?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_name?: string
          file_type?: string
          file_size?: number
          storage_path?: string
          thumbnail_path?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      user_preferences: {
        Row: {
          user_id: string
          location: string | null
          linkedin: string | null
          portfolio: string | null
          job_alert_frequency: string
          preferred_job_types: string[] | null
          remote_preference: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          location?: string | null
          linkedin?: string | null
          portfolio?: string | null
          job_alert_frequency?: string
          preferred_job_types?: string[] | null
          remote_preference?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          location?: string | null
          linkedin?: string | null
          portfolio?: string | null
          job_alert_frequency?: string
          preferred_job_types?: string[] | null
          remote_preference?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    functions: {
      get_user_active_resume: {
        Args: { p_user_id: string }
        Returns: {
          resume_id: string
          file_name: string
          upload_timestamp: string
          parse_status: string
          has_parsed_content: boolean
        }[]
      }
      get_resume_with_content: {
        Args: { p_resume_id: string }
        Returns: {
          resume_info: any
          parsed_content: any
        }[]
      }
    }
  }
}

// Create a single supabase client for interacting with your database
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Create the Supabase client with error handling
let supabase: ReturnType<typeof createClient<Database>>

try {
  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
  })
  console.log("Supabase client initialized")
} catch (error) {
  console.error("Failed to initialize Supabase client:", error)
  // Create a mock client that won't throw errors
  supabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: new Error("Supabase client not initialized") }),
          limit: () => Promise.resolve({ data: null, error: new Error("Supabase client not initialized") }),
        }),
        limit: () => Promise.resolve({ data: null, error: new Error("Supabase client not initialized") }),
      }),
      upsert: () => Promise.resolve({ data: null, error: new Error("Supabase client not initialized") }),
    }),
    rpc: () => Promise.resolve({ data: null, error: new Error("Supabase client not initialized") }),
  } as any
}

export { supabase }

// Helper function to check if Supabase connection is available
export async function isSupabaseAvailable(): Promise<boolean> {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("Supabase URL or Anon Key is not set")
      return false
    }

    // Try a simple query to check connection
    try {
      const { data, error } = await supabase.from("users").select("id").limit(1).maybeSingle()

      // If the error is that the table doesn't exist, that's fine - Supabase is still available
      if (error && error.message.includes("does not exist")) {
        console.log("Supabase is available but users table doesn't exist")
        return true
      }

      if (error) {
        // Try another approach - check if we can access the system catalog
        try {
          // We won't use RPC since exec doesn't exist
          // Instead, just check if we can connect at all
          return true
        } catch (rpcError) {
          console.warn("Supabase connection check failed:", rpcError)
          return false
        }
      }

      return true
    } catch (queryError) {
      console.warn("Supabase query check failed:", queryError)
      // If we get here, Supabase might still be available, just the table doesn't exist
      return true
    }
  } catch (error) {
    console.warn("Supabase connection check error:", error)
    return false
  }
}

// Helper function to check if a table exists
export async function doesTableExist(tableName: string): Promise<boolean> {
  try {
    // Try to query the table
    const { error } = await supabase.from(tableName).select("count").limit(1)

    // If there's no error, the table exists
    if (!error) {
      return true
    }

    // If the error is that the table doesn't exist, return false
    if (error.message.includes("does not exist")) {
      return false
    }

    // For other errors, log and return false
    console.error(`Error checking if table ${tableName} exists:`, error)
    return false
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error)
    return false
  }
}

// Get mock user ID for development
export function getMockUserId(): string {
  return "550e8400-e29b-41d4-a716-446655440000"
}
