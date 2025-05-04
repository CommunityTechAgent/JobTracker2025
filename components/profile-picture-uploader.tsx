"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Camera, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { uploadProfilePicture } from "@/app/actions/upload-actions"
import { useToast } from "@/hooks/use-toast"

interface ProfilePictureUploaderProps {
  currentImageUrl?: string
  onUploadComplete?: (url: string) => void
  className?: string
}

export function ProfilePictureUploader({
  currentImageUrl = "/placeholder.svg?height=128&width=128",
  onUploadComplete,
  className,
}: ProfilePictureUploaderProps) {
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [progress, setProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string>(currentImageUrl)
  const [errorMessage, setErrorMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const simulateProgress = () => {
    setProgress(0)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + 10
      })
    }, 100)
    return interval
  }

  const handleUpload = async (file: File) => {
    try {
      // Create a preview
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)

      setUploadState("uploading")
      setErrorMessage("")

      // Simulate progress while uploading
      const progressInterval = simulateProgress()

      // Create FormData and append file
      const formData = new FormData()
      formData.append("file", file)

      // Upload file using server action
      const result = await uploadProfilePicture(formData)

      // Clear progress interval
      clearInterval(progressInterval)

      if (result.success) {
        setProgress(100)
        setUploadState("success")

        // Call the callback with the new URL
        if (onUploadComplete) {
          onUploadComplete(result.url)
        }

        toast({
          title: "Profile picture updated",
          description: "Your profile picture has been updated successfully.",
        })
      } else {
        setProgress(0)
        setUploadState("error")
        setPreviewUrl(currentImageUrl) // Revert to original image
        setErrorMessage(result.error || "Failed to upload image. Please try again.")
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: result.error || "Failed to upload image. Please try again.",
        })
      }
    } catch (error) {
      setProgress(0)
      setUploadState("error")
      setPreviewUrl(currentImageUrl) // Revert to original image
      setErrorMessage("An unexpected error occurred. Please try again.")
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "An unexpected error occurred. Please try again.",
      })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  return (
    <div className={className}>
      <div className="relative mx-auto w-fit">
        <Avatar className="h-24 w-24">
          <AvatarImage src={previewUrl || "/placeholder.svg"} alt="Profile" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>

        {uploadState === "uploading" && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
            <Progress value={progress} className="h-2 w-16" />
          </div>
        )}

        {uploadState === "success" && (
          <div className="absolute bottom-0 right-0 rounded-full bg-green-500 p-1 text-white">
            <Check className="h-4 w-4" />
          </div>
        )}

        {uploadState === "error" && (
          <div className="absolute bottom-0 right-0 rounded-full bg-red-500 p-1 text-white">
            <AlertCircle className="h-4 w-4" />
          </div>
        )}

        <Button
          size="icon"
          variant="secondary"
          className="absolute bottom-0 right-0 rounded-full shadow-md"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadState === "uploading"}
        >
          <Camera className="h-4 w-4" />
          <span className="sr-only">Upload profile picture</span>
          <input
            type="file"
            className="sr-only"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            ref={fileInputRef}
          />
        </Button>
      </div>

      {errorMessage && <p className="mt-2 text-center text-sm text-red-500">{errorMessage}</p>}

      <p className="mt-2 text-center text-xs text-muted-foreground">
        Click the camera icon to upload a new profile picture
      </p>
    </div>
  )
}
