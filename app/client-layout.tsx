"use client"

import type React from "react"
import { DashboardNav } from "@/components/dashboard-nav"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { DatabaseErrorBoundary } from "@/components/database-error-boundary"

// Separate client component to use usePathname
export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/forgot-password"

  // For auth pages, don't show the dashboard layout
  if (isAuthPage) {
    return children
  }

  // For all other pages, show the dashboard layout
  return (
    <DatabaseErrorBoundary>
      <div className="flex min-h-screen flex-col">
        <div className="flex flex-1">
          <DashboardNav />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </DatabaseErrorBoundary>
  )
}
