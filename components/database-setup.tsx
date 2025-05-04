"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function DatabaseSetup() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    error?: string
    results?: Record<string, any>
  } | null>(null)

  const runMigrations = async () => {
    try {
      setIsLoading(true)
      setResult(null)

      const response = await fetch("/api/db/migrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ migration: "run_all_migrations" }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Setup</CardTitle>
        <CardDescription>Initialize the database tables required for the application</CardDescription>
      </CardHeader>
      <CardContent>
        {result && (
          <Alert variant={result.success ? "default" : "destructive"} className="mb-4">
            {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>
              {result.success
                ? "Database tables were successfully created."
                : `Failed to create database tables: ${result.error}`}

              {result.results && (
                <details className="mt-2 text-xs">
                  <summary>Migration Details</summary>
                  <pre className="mt-2 whitespace-pre-wrap text-xs">{JSON.stringify(result.results, null, 2)}</pre>
                </details>
              )}
            </AlertDescription>
          </Alert>
        )}

        <p className="text-sm text-muted-foreground mb-4">
          If you're seeing database errors, you may need to initialize the database tables. Click the button below to
          create all required tables.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={runMigrations} disabled={isLoading}>
          {isLoading ? "Creating Tables..." : "Initialize Database Tables"}
        </Button>
      </CardFooter>
    </Card>
  )
}
