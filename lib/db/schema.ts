export const SCHEMA = {
  USERS: `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      first_name TEXT,
      last_name TEXT,
      email TEXT UNIQUE,
      phone TEXT,
      location TEXT,
      linkedin TEXT,
      portfolio TEXT,
      profile_image_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,

  PROFILE_IMAGES: `
    CREATE TABLE IF NOT EXISTS profile_images (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      file_name TEXT,
      file_type TEXT,
      file_size INTEGER,
      storage_path TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `,

  RESUMES: `
    CREATE TABLE IF NOT EXISTS resumes (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      file_name TEXT,
      file_type TEXT,
      file_size INTEGER,
      storage_path TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `,

  SKILLS: `
    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE,
      category TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,

  USER_SKILLS: `
    CREATE TABLE IF NOT EXISTS user_skills (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      skill_id TEXT REFERENCES skills(id),
      proficiency_level INTEGER,
      years_experience NUMERIC(5,2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_skill FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
      CONSTRAINT unique_user_skill UNIQUE (user_id, skill_id)
    )
  `,
}

export async function setupDatabase(db) {
  try {
    console.log("Setting up database tables...")

    // Create tables in the correct order (respecting foreign key constraints)
    await db.query(SCHEMA.USERS)
    console.log("Users table created or already exists")

    await db.query(SCHEMA.PROFILE_IMAGES)
    console.log("Profile images table created or already exists")

    await db.query(SCHEMA.RESUMES)
    console.log("Resumes table created or already exists")

    await db.query(SCHEMA.SKILLS)
    console.log("Skills table created or already exists")

    await db.query(SCHEMA.USER_SKILLS)
    console.log("User skills table created or already exists")

    return { success: true }
  } catch (error) {
    console.error("Error setting up database:", error)
    return {
      success: false,
      error: error.message,
      dbAvailable: true, // The database is available, but setup failed
    }
  }
}
