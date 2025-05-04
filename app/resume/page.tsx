"use client"

import { ResumeHeader } from "@/components/resume-header"
import { ResumeUploader } from "@/components/resume-uploader"
import { ResumePreview } from "@/components/resume-preview"
import { ParsedResumeData } from "@/components/parsed-resume-data"
import { SupabaseStatus } from "@/components/supabase-status"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { DatabaseSetup } from "@/components/database-setup"
import { useState, useEffect } from "react"

export default function ResumePage() {
  const [databaseError, setDatabaseError] = useState<string | null>(null)
  const [dbInitError, setDbInitError] = useState<Error | null>(null)
  const [supabaseAvailable, setSupabaseAvailable] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    // Check database status
    const checkDatabase = async () => {
      try {
        setIsLoading(true)

        // Check if Supabase is available
        const availabilityResponse = await fetch("/api/db/check-availability")
        const availabilityData = await availabilityResponse.json()
        setSupabaseAvailable(availabilityData.available)

        if (availabilityData.available) {
          // Try to initialize the database
          const initResponse = await fetch("/api/db/init-database")
          const initData = await initResponse.json()

          if (!initData.success) {
            setDbInitError(new Error(initData.error || "Unknown error initializing database"))
          }
        }

        // Check if tables are initialized
        const response = await fetch("/api/db/check")
        const data = await response.json()

        if (!data.initialized) {
          setDatabaseError("Database tables not initialized. Please use the setup below.")
        } else {
          setDatabaseError(null)
        }
      } catch (error) {
        console.error("Database check error:", error)
        setDatabaseError("Failed to check database status")
        setDbInitError(error instanceof Error ? error : new Error("Unknown error"))
      } finally {
        setIsLoading(false)
      }
    }

    checkDatabase()
  }, [])

  return (
    <div className="flex flex-col">
      <ResumeHeader />
      <div className="container grid gap-6 px-4 py-6 md:grid-cols-2">
        <div className="space-y-6">
          <SupabaseStatus />

          {dbInitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Database Initialization Error</AlertTitle>
              <AlertDescription>
                There was an error initializing the database. The application will use mock data instead.
                {process.env.NODE_ENV === "development" && (
                  <details className="mt-2 text-xs">
                    <summary>Error Details (Development Only)</summary>
                    <pre className="mt-2 whitespace-pre-wrap text-xs">{dbInitError.toString()}</pre>
                  </details>
                )}
              </AlertDescription>
            </Alert>
          )}

          {databaseError && (
            <div className="mb-8">
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>{databaseError}</AlertDescription>
              </Alert>
              <DatabaseSetup />
            </div>
          )}

          <DatabaseSetup />
          <ResumeUploader />
          <ParsedResumeData />
        </div>
        <ResumePreview />
      </div>
    </div>
  )
}
