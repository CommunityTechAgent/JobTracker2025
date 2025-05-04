import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { updateProfilePicture } from '@/lib/services/profile-service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// POST /api/profile/picture - upload profile picture
export async function POST(request: Request) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { imageUrl } = await request.json()
    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    const updatedProfile = await updateProfilePicture(user.id, imageUrl)
    if (!updatedProfile) {
      return NextResponse.json({ error: 'Failed to update profile picture' }, { status: 400 })
    }

    return NextResponse.json(updatedProfile)
  } catch (error) {
    console.error('Error updating profile picture:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
