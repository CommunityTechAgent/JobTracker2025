import { createClient } from "@supabase/supabase-js"

export async function initAuthTables() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.warn("Supabase credentials not found, skipping auth table initialization")
      return { success: false, message: "Supabase credentials not found" }
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Create users table if it doesn't exist
    const { error: createError } = await supabase.rpc("create_users_table_if_not_exists", {})

    if (createError) {
      // If the RPC doesn't exist, we'll create the table directly
      if (createError.message.includes("does not exist")) {
        const { error } = await supabase.query(`
          CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT UNIQUE NOT NULL,
            name TEXT,
            avatar_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Create trigger to update updated_at
          CREATE OR REPLACE FUNCTION update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
          
          DROP TRIGGER IF EXISTS update_users_updated_at ON users;
          CREATE TRIGGER update_users_updated_at
          BEFORE UPDATE ON users
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
        `)

        if (error) {
          console.error("Error creating users table:", error)
          return { success: false, message: error.message }
        }
      } else {
        console.error("Error calling create_users_table_if_not_exists:", createError)
        return { success: false, message: createError.message }
      }
    }

    return { success: true, message: "Auth tables initialized successfully" }
  } catch (error) {
    console.error("Error initializing auth tables:", error)
    return { success: false, message: error instanceof Error ? error.message : "Unknown error" }
  }
}
