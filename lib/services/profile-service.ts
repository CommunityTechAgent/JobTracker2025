import { supabase } from '@/lib/supabase/client'
import { v4 as uuidv4 } from "uuid"

export interface Profile {
  id: string
  user_id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  profile_picture_url: string | null
  created_at: string
  updated_at: string
}

export interface ProfilePreferences {
  id: string
  profile_id: string
  theme: string
  notifications_enabled: boolean
  newsletter_subscription: boolean
  created_at: string
  updated_at: string
}

// Check if a profile exists for a user
export async function profileExists(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error checking profile existence:', error)
    return false
  }

  return !!data
}

// Get a user's profile
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data
}

// Create a new profile
export async function createProfile(userId: string, data: Partial<Profile>): Promise<Profile | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .insert([{ user_id: userId, ...data }])
    .select()
    .single()

  if (error) {
    console.error('Error creating profile:', error)
    return null
  }

  // Create default preferences
  await createDefaultPreferences(profile.id)

  return profile
}

// Update a profile
export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    return null
  }

  return data
}

// Update profile picture
export async function updateProfilePicture(userId: string, imageUrl: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ profile_picture_url: imageUrl })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile picture:', error)
    return null
  }

  return data
}

// Update profile preferences
export async function updateProfilePreferences(
  userId: string,
  preferences: Partial<ProfilePreferences>,
): Promise<ProfilePreferences> {
  try {
    // Get the profile ID first
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .single()

    if (profileError) {
      throw profileError
    }

    const profileId = profileData.id

    // Check if preferences exist
    const { data: existingPrefs, error: existingError } = await supabase
      .from("profile_preferences")
      .select("id")
      .eq("profile_id", profileId)
      .single()

    if (existingError && existingError.code !== "PGRST116") {
      throw existingError
    }

    let updatedPreferences

    if (!existingPrefs) {
      // Create preferences if they don't exist
      const { data: newPrefs, error: createError } = await supabase
        .from("profile_preferences")
        .insert({
          profile_id: profileId,
          theme: preferences.theme || "system",
          notifications_enabled:
            preferences.notificationsEnabled !== undefined ? preferences.notificationsEnabled : true,
          newsletter_subscription:
            preferences.newsletterSubscription !== undefined ? preferences.newsletterSubscription : false,
        })
        .select()
        .single()

      if (createError) {
        throw createError
      }

      updatedPreferences = newPrefs
    } else {
      // Update existing preferences
      const { data: updatedPrefs, error: updateError } = await supabase
        .from("profile_preferences")
        .update({
          theme: preferences.theme,
          notifications_enabled: preferences.notificationsEnabled,
          newsletter_subscription: preferences.newsletterSubscription,
        })
        .eq("profile_id", profileId)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      updatedPreferences = updatedPrefs
    }

    return {
      id: updatedPreferences.id,
      profile_id: updatedPreferences.profile_id,
      theme: updatedPreferences.theme,
      notifications_enabled: updatedPreferences.notifications_enabled,
      newsletter_subscription: updatedPreferences.newsletter_subscription,
      created_at: updatedPreferences.created_at,
      updated_at: updatedPreferences.updated_at,
    }
  } catch (error) {
    console.error("Error updating profile preferences:", error)
    throw new Error("Failed to update profile preferences")
  }
}

async function createDefaultPreferences(profileId: string): Promise<ProfilePreferences | null> {
  const { data, error } = await supabase
    .from('profile_preferences')
    .insert([{ profile_id: profileId }])
    .select()
    .single()

  if (error) {
    console.error('Error creating default preferences:', error)
    return null
  }

  return data
}
