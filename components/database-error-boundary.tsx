"use client"

import type React from "react"

import { Component, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import { DatabaseSetup } from "@/components/database-setup"

interface DatabaseErrorBoundaryProps {
  children: ReactNode
}

interface DatabaseErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class DatabaseErrorBoundary extends Component<DatabaseErrorBoundaryProps, DatabaseErrorBoundaryState> {
  constructor(props: DatabaseErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Database error boundary caught error:", error, errorInfo)
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      // Check if error is database-related
      const isDatabaseError =
        this.state.error?.message?.includes("database") ||
        this.state.error?.message?.includes("table") ||
        this.state.error?.message?.includes("relation") ||
        this.state.error?.message?.includes("SQL") ||
        this.state.error?.message?.includes("supabase")

      if (isDatabaseError) {
        return (
          <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-2xl font-bold mb-2">Database Error</h2>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              There was an issue with the database. The tables may not be initialized properly.
            </p>

            <div className="w-full max-w-md">
              <DatabaseSetup />
            </div>

            <div className="mt-6">
              <Button onClick={() => this.setState({ hasError: false })}>Try Again</Button>
            </div>

            <details className="mt-6 text-xs text-muted-foreground">
              <summary>Error Details</summary>
              <pre className="mt-2 p-2 bg-muted rounded-md overflow-auto max-w-md">{this.state.error?.message}</pre>
            </details>
          </div>
        )
      }

      // Generic error fallback
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">{this.state.error?.message || "An unexpected error occurred"}</p>
          <Button onClick={() => this.setState({ hasError: false })}>Try again</Button>
        </div>
      )
    }

    return this.props.children
  }
}
