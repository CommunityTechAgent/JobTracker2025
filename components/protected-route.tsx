"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Skip protection for the landing page (dashboard) and auth pages
    if (pathname === "/" || pathname === "/login" || pathname === "/register") return

    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router, pathname])

  // Show loading state
  if (isLoading && pathname !== "/") {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // User is authenticated or on the landing page, render children
  return <>{children}</>
}
