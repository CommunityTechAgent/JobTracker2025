import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { updateProfilePreferences } from '@/lib/services/profile-service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET /api/profile/preferences - get profile preferences
export async function GET(request: Request) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: preferences, error } = await supabase
      .from('preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 400 })
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error fetching preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/profile/preferences - update profile preferences
export async function PUT(request: Request) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const preferences = await request.json()
    const updatedPreferences = await updateProfilePreferences(user.id, preferences)
    if (!updatedPreferences) {
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 400 })
    }

    return NextResponse.json(updatedPreferences)
  } catch (error) {
    console.error('Error updating preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
