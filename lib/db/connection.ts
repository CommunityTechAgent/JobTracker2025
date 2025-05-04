import { supabase } from '@/lib/supabase/client'

export { supabase }

export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1)
    if (error) {
      console.error('Database connection error:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Database availability check error:', error)
    return false
  }
}

// Mock user ID function for development
export function getMockUserId(): string {
  return 'mock-user-id'
}
