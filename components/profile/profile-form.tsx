"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { ProfilePictureUploader } from "./profile-picture-uploader"
import {
  updateProfile,
  updateProfilePreferences,
  type ProfileData,
  type ProfilePreferences,
} from "@/lib/services/profile-service"

// Define the form schema with Zod
const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").readonly(),
})

const preferencesFormSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  notificationsEnabled: z.boolean(),
  newsletterSubscription: z.boolean(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>
type PreferencesFormValues = z.infer<typeof preferencesFormSchema>

interface ProfileFormProps {
  initialProfile: ProfileData
  initialPreferences: ProfilePreferences
  onSuccess?: () => void
}

export function ProfileForm({ initialProfile, initialPreferences, onSuccess }: ProfileFormProps) {
  const [activeTab, setActiveTab] = useState("personal")
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false)
  const [isSubmittingPreferences, setIsSubmittingPreferences] = useState(false)
  const [profilePictureUrl, setProfilePictureUrl] = useState(initialProfile.profilePictureUrl || "")
  const { toast } = useToast()

  // Initialize profile form with react-hook-form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: initialProfile.firstName || "",
      lastName: initialProfile.lastName || "",
      email: initialProfile.email || "",
    },
  })

  // Initialize preferences form with react-hook-form
  const preferencesForm = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesFormSchema),
    defaultValues: {
      theme: (initialPreferences?.theme as "light" | "dark" | "system") || "system",
      notificationsEnabled: initialPreferences?.notificationsEnabled ?? true,
      newsletterSubscription: initialPreferences?.newsletterSubscription ?? false,
    },
  })

  // Handle profile form submission
  const onSubmitProfile = async (data: ProfileFormValues) => {
    try {
      setIsSubmittingProfile(true)

      // Update profile with form data
      await updateProfile(initialProfile.userId!, {
        firstName: data.firstName,
        lastName: data.lastName,
        // Email is readonly, so we don't update it
      })

      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      })

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error updating profile:", error)

      toast({
        variant: "destructive",
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
      })
    } finally {
      setIsSubmittingProfile(false)
    }
  }

  // Handle preferences form submission
  const onSubmitPreferences = async (data: PreferencesFormValues) => {
    try {
      setIsSubmittingPreferences(true)

      // Update preferences with form data
      await updateProfilePreferences(initialProfile.userId!, {
        theme: data.theme,
        notificationsEnabled: data.notificationsEnabled,
        newsletterSubscription: data.newsletterSubscription,
      })

      toast({
        title: "Preferences updated",
        description: "Your preferences have been updated successfully.",
      })

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error updating preferences:", error)

      toast({
        variant: "destructive",
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update preferences. Please try again.",
      })
    } finally {
      setIsSubmittingPreferences(false)
    }
  }

  // Handle profile picture update
  const handleProfilePictureUpdate = (url: string) => {
    setProfilePictureUrl(url)

    toast({
      title: "Profile picture updated",
      description: "Your profile picture has been updated successfully.",
    })
  }

  return (
    <Tabs defaultValue="personal" value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="personal">Personal Info</TabsTrigger>
        <TabsTrigger value="preferences">Preferences</TabsTrigger>
        <TabsTrigger value="account">Account</TabsTrigger>
      </TabsList>

      <TabsContent value="personal" className="space-y-6 pt-4">
        <div className="flex flex-col items-center mb-6">
          <ProfilePictureUploader initialImageUrl={profilePictureUrl} onUploadComplete={handleProfilePictureUpdate} />
        </div>

        <Form {...profileForm}>
          <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={profileForm.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={profileForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john.doe@example.com" {...field} disabled className="bg-muted" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="submit" disabled={isSubmittingProfile}>
                {isSubmittingProfile ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </TabsContent>

      <TabsContent value="preferences" className="space-y-6 pt-4">
        <Form {...preferencesForm}>
          <form onSubmit={preferencesForm.handleSubmit(onSubmitPreferences)} className="space-y-6">
            <FormField
              control={preferencesForm.control}
              name="theme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Theme</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={field.value}
                      onChange={field.onChange}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={preferencesForm.control}
              name="notificationsEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Notifications</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Receive notifications about job matches and application updates.
                    </div>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={preferencesForm.control}
              name="newsletterSubscription"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Newsletter</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Receive our weekly newsletter with job search tips and career advice.
                    </div>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="submit" disabled={isSubmittingPreferences}>
                {isSubmittingPreferences ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Preferences"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </TabsContent>

      <TabsContent value="account" className="space-y-6 pt-4">
        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-medium">Account Settings</h3>
          <p className="text-sm text-muted-foreground mt-2">Manage your account settings and security preferences.</p>

          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Change Password</h4>
                <p className="text-sm text-muted-foreground">Update your password for better security</p>
              </div>
              <Button variant="outline">Change Password</Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Delete Account</h4>
                <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
              </div>
              <Button variant="destructive">Delete Account</Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
