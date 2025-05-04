"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Upload, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ProfilePictureUploaderProps {
  initialImageUrl?: string
  onUploadComplete: (url: string) => void
}

export function ProfilePictureUploader({ initialImageUrl, onUploadComplete }: ProfilePictureUploaderProps) {
  const [imageUrl, setImageUrl] = useState(initialImageUrl || "")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, GIF, or WebP image.",
      })
      return
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Maximum file size is 2MB.",
      })
      return
    }

    try {
      setIsUploading(true)

      // Create form data
      const formData = new FormData()
      formData.append("file", file)

      // Upload the file
      const response = await fetch("/api/profile/picture", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload image")
      }

      const data = await response.json()

      // Update the image URL
      setImageUrl(data.imageUrl)

      // Call the callback
      onUploadComplete(data.imageUrl)
    } catch (error) {
      console.error("Error uploading profile picture:", error)

      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image. Please try again.",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <Avatar className="h-24 w-24">
        <AvatarImage src={imageUrl || "/placeholder.svg"} alt="Profile picture" />
        <AvatarFallback className="bg-primary/10">
          <User className="h-12 w-12 text-primary/80" />
        </AvatarFallback>
      </Avatar>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
      />

      <Button type="button" variant="outline" size="sm" onClick={handleButtonClick} disabled={isUploading}>
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" /> Change Picture
          </>
        )}
      </Button>
    </div>
  )
}
