"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createProfile } from "@/lib/services/profile-service"

interface RegisterOptions {
  firstName?: string
  lastName?: string
  email: string
  password: string
}

interface RegisterResult {
  success: boolean
  error?: string
  userId?: string
}

export function useAuthRegister() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const register = async (options: RegisterOptions): Promise<RegisterResult> => {
    try {
      setIsLoading(true)

      // 1. Register the user with Supabase Auth
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: options.email,
          password: options.password,
          firstName: options.firstName,
          lastName: options.lastName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || "Registration failed",
        }
      }

      const userId = data.user?.id

      if (!userId) {
        return {
          success: false,
          error: "User ID not returned from registration",
        }
      }

      // 2. Create a profile for the user
      try {
        await createProfile(userId, {
          firstName: options.firstName,
          lastName: options.lastName,
          email: options.email,
        })
      } catch (profileError) {
        console.error("Error creating profile:", profileError)
        // Continue anyway, as the user was created successfully
      }

      // 3. Redirect to login page or dashboard
      router.push("/login?registered=true")

      return {
        success: true,
        userId,
      }
    } catch (error) {
      console.error("Registration error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    register,
    isLoading,
  }
}
