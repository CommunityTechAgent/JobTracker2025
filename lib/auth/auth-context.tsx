"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Checking authentication status...")
        const res = await fetch("/api/auth/session", {
          credentials: "include", // Important: Include cookies with the request
        })

        console.log("Session response status:", res.status)

        if (res.ok) {
          try {
            const text = await res.text()
            let data

            try {
              data = JSON.parse(text)
            } catch (e) {
              console.error("Failed to parse session response:", text)
              createMockUserIfDevelopment()
              return
            }

            console.log("Session data:", data)

            if (data.user) {
              setUser(data.user)
              console.log("User is authenticated:", data.user)
            } else {
              console.log("No user in session data")
              createMockUserIfDevelopment()
            }
          } catch (parseError) {
            console.error("Error parsing session response:", parseError)
            createMockUserIfDevelopment()
          }
        } else {
          console.log("Failed to fetch session:", res.status)
          createMockUserIfDevelopment()
        }
      } catch (error) {
        console.error("Failed to fetch session:", error)
        createMockUserIfDevelopment()
      } finally {
        setIsLoading(false)
      }
    }

    const createMockUserIfDevelopment = () => {
      // For development, create a mock user
      if (process.env.NODE_ENV === "development") {
        console.log("Creating mock user for development")
        setUser({
          id: "dev-user-" + Math.random().toString(36).substring(2, 15),
          email: "dev@example.com",
          name: "Development User",
        })
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      console.log("Attempting login with:", email)

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include", // Important: Include cookies with the request
      })

      // Get response as text first to handle potential parsing issues
      const responseText = await res.text()
      console.log("Login response:", responseText)

      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        console.error("Failed to parse login response:", responseText)
        return { success: false, error: "Invalid server response" }
      }

      if (!res.ok) {
        console.error("Login failed with status:", res.status, data)
        return { success: false, error: data.error || "Login failed" }
      }

      console.log("Login successful:", data)
      setUser(data.user)

      // Use a small timeout to ensure state updates before navigation
      setTimeout(() => {
        router.push("/profile")
      }, 100)

      return { success: true }
    } catch (error) {
      console.error("Login failed:", error)
      return { success: false, error: "An unexpected error occurred" }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // Important: Include cookies with the request
      })
      setUser(null)
      // Always redirect to the dashboard after logout
      router.push("/")
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
