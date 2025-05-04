import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import ClientLayout from "./client-layout"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "JobTrack - Your Job Application Dashboard",
  description: "Track your job applications, skills, and career progress",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ProtectedRoute>
            <ClientLayout>{children}</ClientLayout>
          </ProtectedRoute>
        </AuthProvider>
      </body>
    </html>
  )
}
