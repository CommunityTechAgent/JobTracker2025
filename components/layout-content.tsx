"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/forgot-password"

  // For auth pages, don't show the dashboard layout
  if (isAuthPage) {
    return children
  }

  // For all other pages, show the dashboard layout
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        <DashboardNav />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
