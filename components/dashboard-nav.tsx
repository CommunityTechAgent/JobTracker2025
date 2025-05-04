"use client"

import type React from "react"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BarChart, FileText, Briefcase, Award, Mail, Settings, User, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function DashboardNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const routes = [
    {
      href: "/",
      icon: BarChart,
      title: "Dashboard",
    },
    {
      href: "/resume",
      icon: FileText,
      title: "Resume",
    },
    {
      href: "/skills",
      icon: Award,
      title: "Skills",
    },
    {
      href: "/jobs",
      icon: Briefcase,
      title: "Jobs",
    },
    {
      href: "/cover-letters",
      icon: Mail,
      title: "Cover Letters",
    },
  ]

  // Handle navigation for unauthenticated users
  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Allow navigation to dashboard without authentication
    if (href === "/" || user) return true

    // For other routes, prevent default navigation and redirect to login with returnTo
    e.preventDefault()
    router.push(`/login?returnTo=${encodeURIComponent(href)}&reason=protected`)
    return false
  }

  // Handle settings/profile navigation for unauthenticated users
  const handleSettingsNavigation = (path: string) => {
    if (!user) {
      router.push(`/login?returnTo=${encodeURIComponent(path)}&reason=protected`)
    } else {
      router.push(path)
    }
  }

  return (
    <div className="flex h-screen w-16 flex-col justify-between border-r bg-muted/40 p-3 md:w-64">
      <div className="flex flex-col gap-6">
        <div className="flex h-16 items-center px-2 md:px-4">
          <Link href="/" className="flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            <span className="hidden text-xl font-bold md:inline-block">JobTrack</span>
          </Link>
        </div>
        <nav className="grid gap-1 px-2">
          {routes.map((route) => (
            <Button
              key={route.href}
              variant={pathname === route.href ? "secondary" : "ghost"}
              className={cn("justify-start", pathname === route.href && "bg-secondary")}
              asChild
            >
              <Link href={route.href} onClick={(e) => handleNavigation(e, route.href)}>
                <route.icon className="mr-2 h-5 w-5" />
                <span className="hidden md:inline-block">{route.title}</span>
              </Link>
            </Button>
          ))}
        </nav>
      </div>
      <div className="mt-auto grid gap-1 px-2">
        <Button variant="ghost" className="justify-start" onClick={() => handleSettingsNavigation("/settings")}>
          <Settings className="mr-2 h-5 w-5" />
          <span className="hidden md:inline-block">Settings</span>
        </Button>
        <Button variant="ghost" className="justify-start" onClick={() => handleSettingsNavigation("/profile")}>
          <User className="mr-2 h-5 w-5" />
          <span className="hidden md:inline-block">Profile</span>
        </Button>
        <div className="mt-6 flex items-center gap-2 rounded-lg px-2 py-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto w-full justify-start p-0 hover:bg-transparent">
                  <Avatar>
                    <AvatarImage
                      src={user?.avatarUrl || "/placeholder.svg?height=32&width=32"}
                      alt={user?.name || "User"}
                    />
                    <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="ml-2 hidden md:block">
                    <p className="text-sm font-medium">{user?.name || "Guest"}</p>
                    <p className="text-xs text-muted-foreground">{user?.email || "guest@example.com"}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              className="h-auto w-full justify-start p-0"
              onClick={() => router.push(`/login?returnTo=${encodeURIComponent(pathname)}`)}
            >
              <Avatar>
                <AvatarFallback>G</AvatarFallback>
              </Avatar>
              <div className="ml-2 hidden md:block">
                <p className="text-sm font-medium">Guest User</p>
                <p className="text-xs text-muted-foreground">Click to login</p>
              </div>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
