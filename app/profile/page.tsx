"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileForm } from "@/components/profile-form"
import { ProfileImageUploader } from "@/components/profile-image-uploader"
import { getProfile, type Profile } from "@/lib/services/profile-service"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"

// Transform Profile type to match form data
type ProfileData = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  profileImageUrl: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { logout } = useAuth()

  // Initialize database and fetch profile
  const initializeAndFetchProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check database status first
      setIsInitializing(true)
      try {
        const dbCheckResponse = await fetch("/api/db/check")
        const dbStatus = await dbCheckResponse.json()

        if (!dbStatus.initialized) {
          // Try to initialize the database
          const initResponse = await fetch("/api/db/init-database")
          const initData = await initResponse.json()

          if (!initData.success) {
            console.warn("Database initialization failed:", initData.error)
            // Continue with mock data
            setProfile({
              id: "mock-user",
              firstName: "John",
              lastName: "Doe",
              email: "john@example.com",
              phone: "",
              profileImageUrl: "",
            })
            return
          }
        }
      } catch (dbCheckError) {
        console.error("Database check error:", dbCheckError)
        // Continue with mock data
        setProfile({
          id: "mock-user",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phone: "",
          profileImageUrl: "",
        })
      } finally {
        setIsInitializing(false)
      }

      // Fetch profile data
      const profileData = await getProfile("mock-user") // TODO: Replace with actual user ID
      if (profileData) {
        setProfile({
          id: profileData.id,
          firstName: profileData.first_name || "",
          lastName: profileData.last_name || "",
          email: profileData.email || "",
          phone: "",
          profileImageUrl: profileData.profile_picture_url || "",
        })
      }
    } catch (err) {
      console.error("Error:", err)

      // Check if it's a database initialization error
      const errorMessage = err instanceof Error ? err.message : "Failed to load profile"
      const isDatabaseError =
        errorMessage.includes("database") || errorMessage.includes("table") || errorMessage.includes("relation")

      if (isDatabaseError) {
        // Use mock data instead
        setProfile({
          id: "mock-user",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phone: "",
          profileImageUrl: "",
        })
      } else {
        setError(errorMessage)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load profile data. Please try again.",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  // Fetch profile data on component mount
  useEffect(() => {
    initializeAndFetchProfile()
  }, [])

  // Handle profile image update
  const handleImageUpdate = (imageUrl: string) => {
    setProfile((prev: ProfileData | null) => (prev ? { ...prev, profileImageUrl: imageUrl } : null))
  }

  // Handle profile update success
  const handleProfileUpdateSuccess = () => {
    // Refresh the profile data
    initializeAndFetchProfile()
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and preferences</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      {isInitializing && (
        <Alert className="mb-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>Initializing database...</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Image</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileImageUploader
                currentImageUrl={profile?.profileImageUrl}
                onUploadComplete={handleImageUpdate}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileForm
                initialData={profile}
                onSuccess={handleProfileUpdateSuccess}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
