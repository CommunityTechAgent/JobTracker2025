"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SupabaseStatus() {
  const [status, setStatus] = useState<"loading" | "available" | "unavailable">("loading")
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkStatus()
  }, [])

  async function checkStatus() {
    setIsChecking(true)
    setError(null)

    try {
      const response = await fetch("/api/db/init-supabase")
      const data = await response.json()

      if (data.available) {
        setStatus("available")
      } else {
        setStatus("unavailable")
        setError(data.error || "Could not connect to Supabase")
      }
    } catch (err) {
      console.error("Error checking Supabase status:", err)
      setStatus("unavailable")
      setError("Failed to check Supabase status")
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <Alert variant={status === "available" ? "default" : "destructive"}>
      {status === "available" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
      <AlertTitle className="flex items-center justify-between">
        <span>
          Database Status:{" "}
          {status === "loading" ? "Checking..." : status === "available" ? "Connected" : "Disconnected"}
        </span>
        <Button variant="outline" size="sm" onClick={checkStatus} disabled={isChecking} className="h-7 px-2">
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isChecking ? "animate-spin" : ""}`} />
          <span>{isChecking ? "Checking..." : "Check"}</span>
        </Button>
      </AlertTitle>
      <AlertDescription>
        {status === "available" ? (
          "Connected to Supabase database successfully."
        ) : status === "loading" ? (
          "Checking connection to Supabase database..."
        ) : (
          <div>
            <p>Could not connect to Supabase database. The application will use mock data instead.</p>
            {error && (
              <details className="mt-2 text-xs">
                <summary>Error Details</summary>
                <pre className="mt-2 whitespace-pre-wrap text-xs">{error}</pre>
              </details>
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}
