"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Camera, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"

interface ProfileImageUploaderProps {
  currentImageUrl?: string
  onUploadComplete?: (url: string) => void
  className?: string
}

export function ProfileImageUploader({
  currentImageUrl = "/placeholder.svg?height=128&width=128",
  onUploadComplete,
  className,
}: ProfileImageUploaderProps) {
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
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
      if (!allowedTypes.includes(file.type)) {
        setErrorMessage(`Invalid file type: ${file.type}. Please upload a JPEG, PNG, or GIF image.`)
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload a JPEG, PNG, or GIF image.",
        })
        return
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage("File too large. Maximum size is 2MB.")
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Maximum file size is 2MB.",
        })
        return
      }

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

      // Upload the image
      console.log("Uploading file:", file.name, file.type, file.size)

      try {
        const response = await fetch("/api/profile/image/upload", {
          method: "POST",
          body: formData,
        })

        // Clear progress interval
        clearInterval(progressInterval)

        // Log the response for debugging
        console.log("Upload response status:", response.status)
        const result = await response.json()
        console.log("Upload response:", result)

        if (response.ok && result.success) {
          setProgress(100)
          setUploadState("success")

          // Call the callback with the new URL
          if (onUploadComplete && result.imageUrl) {
            onUploadComplete(result.imageUrl)
          }

          // Show a toast message
          toast({
            title: "Profile picture updated",
            description: result.dbUpdateSuccess
              ? "Your profile picture has been updated successfully."
              : "Your profile picture has been updated, but the database could not be updated. Changes may not persist after refresh.",
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
      } catch (fetchError) {
        console.error("Fetch error:", fetchError)
        clearInterval(progressInterval)
        setProgress(0)
        setUploadState("error")
        setPreviewUrl(currentImageUrl) // Revert to original image

        // Check if it's a network error
        const isNetworkError =
          fetchError instanceof TypeError &&
          (fetchError.message.includes("fetch failed") || fetchError.message.includes("network"))

        const errorMsg = isNetworkError
          ? "Network error. Please check your connection and try again."
          : "An unexpected error occurred. Please try again."

        setErrorMessage(errorMsg)
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: errorMsg,
        })
      }
    } catch (error) {
      console.error("Error uploading image:", error)
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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <div className={className}>
      <div
        className="relative mx-auto w-fit"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        role="button"
        tabIndex={0}
        aria-label="Upload profile picture"
      >
        <Avatar className="h-24 w-24">
          <AvatarImage src={previewUrl || "/placeholder.svg"} alt="Profile" />
          <AvatarFallback>
            {previewUrl === "/placeholder.svg?height=128&width=128" ? "?" : previewUrl.charAt(0).toUpperCase()}
          </AvatarFallback>
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
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            ref={fileInputRef}
            aria-label="Upload profile image"
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
