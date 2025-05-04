import { supabase } from "@/lib/supabase/client"

export async function createProfileTables() {
  try {
    console.log("Creating profile tables...")

    // Create profiles table
    const { error: profilesError } = await supabase.from("profiles").select("count").limit(1).single()

    if (profilesError && profilesError.message.includes("does not exist")) {
      const { error: createProfilesError } = await supabase.rpc("create_table", {
        table_sql: `
          CREATE TABLE IF NOT EXISTS profiles (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID UNIQUE NOT NULL,
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            email VARCHAR(255) NOT NULL,
            profile_picture_url VARCHAR(500),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `,
      })

      if (createProfilesError) {
        throw new Error(`Failed to create profiles table: ${createProfilesError.message}`)
      }
      console.log("Profiles table created successfully")
    } else {
      console.log("Profiles table already exists")
    }

    // Create profile_preferences table
    const { error: preferencesError } = await supabase.from("profile_preferences").select("count").limit(1).single()

    if (preferencesError && preferencesError.message.includes("does not exist")) {
      const { error: createPreferencesError } = await supabase.rpc("create_table", {
        table_sql: `
          CREATE TABLE IF NOT EXISTS profile_preferences (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            theme VARCHAR(50) DEFAULT 'light',
            notifications_enabled BOOLEAN DEFAULT true,
            newsletter_subscription BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT fk_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
          );
        `,
      })

      if (createPreferencesError) {
        throw new Error(`Failed to create profile_preferences table: ${createPreferencesError.message}`)
      }
      console.log("Profile preferences table created successfully")
    } else {
      console.log("Profile preferences table already exists")
    }

    // Create updated_at trigger function if it doesn't exist
    const { error: triggerFunctionError } = await supabase.rpc("create_function", {
      function_sql: `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `,
    })

    if (triggerFunctionError) {
      console.warn(`Warning: Failed to create trigger function: ${triggerFunctionError.message}`)
    } else {
      console.log("Updated_at trigger function created or updated")
    }

    // Create triggers for profiles table
    const { error: profilesTriggerError } = await supabase.rpc("create_trigger", {
      trigger_sql: `
        DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
        CREATE TRIGGER update_profiles_updated_at
        BEFORE UPDATE ON profiles
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `,
    })

    if (profilesTriggerError) {
      console.warn(`Warning: Failed to create profiles trigger: ${profilesTriggerError.message}`)
    } else {
      console.log("Profiles updated_at trigger created or updated")
    }

    // Create triggers for profile_preferences table
    const { error: preferencesTriggerError } = await supabase.rpc("create_trigger", {
      trigger_sql: `
        DROP TRIGGER IF EXISTS update_profile_preferences_updated_at ON profile_preferences;
        CREATE TRIGGER update_profile_preferences_updated_at
        BEFORE UPDATE ON profile_preferences
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `,
    })

    if (preferencesTriggerError) {
      console.warn(`Warning: Failed to create profile_preferences trigger: ${preferencesTriggerError.message}`)
    } else {
      console.log("Profile preferences updated_at trigger created or updated")
    }

    // Create indexes
    const { error: indexesError } = await supabase.rpc("create_index", {
      index_sql: `
        CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
        CREATE INDEX IF NOT EXISTS idx_profile_preferences_profile_id ON profile_preferences(profile_id);
      `,
    })

    if (indexesError) {
      console.warn(`Warning: Failed to create indexes: ${indexesError.message}`)
    } else {
      console.log("Indexes created or already exist")
    }

    return { success: true }
  } catch (error) {
    console.error("Error creating profile tables:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Function to check if profile tables exist
export async function checkProfileTables() {
  try {
    // Check if profiles table exists
    const { error: profilesError } = await supabase.from("profiles").select("count").limit(1)

    if (profilesError && profilesError.message.includes("does not exist")) {
      return { exists: false, table: "profiles" }
    }

    // Check if profile_preferences table exists
    const { error: preferencesError } = await supabase.from("profile_preferences").select("count").limit(1)

    if (preferencesError && preferencesError.message.includes("does not exist")) {
      return { exists: false, table: "profile_preferences" }
    }

    return { exists: true }
  } catch (error) {
    console.error("Error checking profile tables:", error)
    return {
      exists: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Function to create RPC functions if they don't exist
export async function createRpcFunctions() {
  try {
    // Create the create_table function
    const createTableSql = `
      CREATE OR REPLACE FUNCTION create_table(table_sql TEXT)
      RETURNS VOID AS $$
      BEGIN
        EXECUTE table_sql;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `

    // Create the create_function function
    const createFunctionSql = `
      CREATE OR REPLACE FUNCTION create_function(function_sql TEXT)
      RETURNS VOID AS $$
      BEGIN
        EXECUTE function_sql;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `

    // Create the create_trigger function
    const createTriggerSql = `
      CREATE OR REPLACE FUNCTION create_trigger(trigger_sql TEXT)
      RETURNS VOID AS $$
      BEGIN
        EXECUTE trigger_sql;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `

    // Create the create_index function
    const createIndexSql = `
      CREATE OR REPLACE FUNCTION create_index(index_sql TEXT)
      RETURNS VOID AS $$
      BEGIN
        EXECUTE index_sql;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `

    // Execute the SQL to create the functions
    const { error: createTableError } = await supabase.rpc("exec", { query: createTableSql })
    const { error: createFunctionError } = await supabase.rpc("exec", { query: createFunctionSql })
    const { error: createTriggerError } = await supabase.rpc("exec", { query: createTriggerSql })
    const { error: createIndexError } = await supabase.rpc("exec", { query: createIndexSql })

    if (createTableError || createFunctionError || createTriggerError || createIndexError) {
      console.warn("Warning: Some RPC functions could not be created. Using fallback method.")
      return { success: false }
    }

    return { success: true }
  } catch (error) {
    console.error("Error creating RPC functions:", error)
    return { success: false }
  }
}

// Fallback method using SQL migrations
export async function createProfileTablesWithSQL() {
  try {
    console.log("Creating profile tables using SQL migrations...")

    // Create extension for UUID generation if it doesn't exist
    await supabase.rpc("exec", {
      query: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
    })

    // Create profiles table
    await supabase.rpc("exec", {
      query: `
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID UNIQUE NOT NULL,
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          email VARCHAR(255) NOT NULL,
          profile_picture_url VARCHAR(500),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    })

    // Create profile_preferences table
    await supabase.rpc("exec", {
      query: `
        CREATE TABLE IF NOT EXISTS profile_preferences (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          profile_id UUID NOT NULL,
          theme VARCHAR(50) DEFAULT 'light',
          notifications_enabled BOOLEAN DEFAULT true,
          newsletter_subscription BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT fk_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
        );
      `,
    })

    // Create updated_at trigger function
    await supabase.rpc("exec", {
      query: `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `,
    })

    // Create triggers for profiles table
    await supabase.rpc("exec", {
      query: `
        DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
        CREATE TRIGGER update_profiles_updated_at
        BEFORE UPDATE ON profiles
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `,
    })

    // Create triggers for profile_preferences table
    await supabase.rpc("exec", {
      query: `
        DROP TRIGGER IF EXISTS update_profile_preferences_updated_at ON profile_preferences;
        CREATE TRIGGER update_profile_preferences_updated_at
        BEFORE UPDATE ON profile_preferences
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `,
    })

    // Create indexes
    await supabase.rpc("exec", {
      query: `
        CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
        CREATE INDEX IF NOT EXISTS idx_profile_preferences_profile_id ON profile_preferences(profile_id);
      `,
    })

    return { success: true }
  } catch (error) {
    console.error("Error creating profile tables with SQL:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
