"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, FileText, Check, AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { uploadResume } from "@/app/actions/upload-actions"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function ResumeUploader() {
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success" | "error" | "parsing">("idle")
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState("")
  const [fileSize, setFileSize] = useState(0)
  const [fileUrl, setFileUrl] = useState("")
  const [fileType, setFileType] = useState("")
  const [resumeId, setResumeId] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
  }

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
    }, 300)
    return interval
  }

  const handleUpload = async (file: File) => {
    try {
      setUploadState("uploading")
      setFileName(file.name)
      setFileSize(file.size)
      setFileType(file.type)
      setErrorMessage("")

      // Simulate progress while uploading
      const progressInterval = simulateProgress()

      // Create FormData and append file
      const formData = new FormData()
      formData.append("file", file)

      // Upload file using server action
      const result = await uploadResume(formData)

      // Clear progress interval
      clearInterval(progressInterval)

      if (result.success) {
        setProgress(100)
        setUploadState("success")
        setFileUrl(result.url)
        setResumeId(result.resumeId)
        toast({
          title: "Resume uploaded successfully",
          description: "Your resume has been uploaded and is ready for parsing.",
        })
      } else {
        setProgress(0)
        setUploadState("error")
        setErrorMessage(result.error || "Failed to upload file. Please try again.")
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: result.error || "Failed to upload file. Please try again.",
        })
      }
    } catch (error) {
      setProgress(0)
      setUploadState("error")
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

  const resetUpload = () => {
    setUploadState("idle")
    setProgress(0)
    setFileName("")
    setFileSize(0)
    setFileUrl("")
    setResumeId("")
    setErrorMessage("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleParseResume = async () => {
    if (!resumeId || !fileUrl || !fileType) {
      toast({
        variant: "destructive",
        title: "Parse failed",
        description: "Missing resume information. Please upload again.",
      })
      return
    }

    try {
      setUploadState("parsing")
      setProgress(0)
      setErrorMessage("")

      // Simulate progress while parsing
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 5
        })
      }, 300)

      // Call the parse API
      const response = await fetch("/api/resume/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeId,
          fileUrl,
          fileType,
        }),
      })

      clearInterval(progressInterval)

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error response from server:", errorText)
        throw new Error(`Server error: ${response.status} ${response.statusText}`)
      }

      // Try to parse the JSON response
      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error("Error parsing JSON response:", jsonError)
        throw new Error("Invalid response from server. Could not parse JSON.")
      }

      if (data.success) {
        setProgress(100)
        toast({
          title: "Resume parsed successfully",
          description: "Your resume has been analyzed and the information has been extracted.",
        })

        // Redirect to the resume view page or reset the form
        resetUpload()

        // Refresh the page to show the parsed data
        window.location.reload()
      } else {
        setUploadState("error")
        const errorMsg = data.error || "Failed to parse resume. Please try again."
        setErrorMessage(errorMsg)
        toast({
          variant: "destructive",
          title: "Parse failed",
          description: errorMsg,
        })
      }
    } catch (error) {
      setUploadState("error")
      const errorMsg =
        error instanceof Error ? error.message : "An unexpected error occurred during parsing. Please try again."
      setErrorMessage(errorMsg)
      toast({
        variant: "destructive",
        title: "Parse failed",
        description: errorMsg,
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Resume</CardTitle>
        <CardDescription>Upload your resume to get started with job matching</CardDescription>
      </CardHeader>
      <CardContent>
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col items-center justify-center gap-4">
          {uploadState === "idle" ? (
            <div
              className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="rounded-full bg-muted p-4">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Drag and drop your resume</p>
                <p className="text-sm text-muted-foreground">Supports PDF, DOCX, and TXT files up to 5MB</p>
              </div>
              <Button asChild>
                <label>
                  Browse Files
                  <input
                    type="file"
                    className="sr-only"
                    accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                  />
                </label>
              </Button>
            </div>
          ) : (
            <div className="w-full space-y-4">
              <div className="flex items-center gap-4">
                <div className="rounded-md bg-muted p-2">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{fileName}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(fileSize)} •
                    {uploadState === "uploading"
                      ? ` Uploading... ${progress}%`
                      : uploadState === "parsing"
                        ? ` Parsing... ${progress}%`
                        : uploadState === "success"
                          ? " Upload complete"
                          : " Upload failed"}
                  </p>
                </div>
                {uploadState === "success" ? (
                  <div className="rounded-full bg-green-100 p-1 text-green-600 dark:bg-green-900 dark:text-green-400">
                    <Check className="h-5 w-5" />
                  </div>
                ) : uploadState === "error" ? (
                  <div className="rounded-full bg-red-100 p-1 text-red-600 dark:bg-red-900 dark:text-red-400">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                ) : null}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetUpload}
                  disabled={uploadState === "uploading" || uploadState === "parsing"}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Cancel</span>
                </Button>
              </div>
              <Progress value={progress} className="h-2 w-full" />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          disabled={uploadState === "uploading" || uploadState === "parsing"}
          onClick={resetUpload}
        >
          Cancel
        </Button>
        <Button disabled={uploadState !== "success" || !resumeId} onClick={handleParseResume}>
          Parse Resume
        </Button>
      </CardFooter>
    </Card>
  )
}
