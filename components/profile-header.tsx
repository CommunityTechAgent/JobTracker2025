import { Button } from "@/components/ui/button"

export function ProfileHeader() {
  return (
    <div className="border-b">
      <div className="flex h-16 items-center justify-between px-6">
        <div>
          <h1 className="text-lg font-semibold md:text-2xl">Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your personal information and preferences</p>
        </div>
        <div className="flex items-center gap-4">
          <Button form="profile-form" type="submit">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
