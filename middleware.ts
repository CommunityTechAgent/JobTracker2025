import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname

  // Define paths that don't require database checks
  const skipDatabaseCheckPaths = ["/api/db", "/api/auth", "/_next", "/favicon.ico", "/login", "/register"]

  // Check if we should skip database check for this path
  const shouldSkipDatabaseCheck = skipDatabaseCheckPaths.some((skipPath) => path.startsWith(skipPath))

  if (!shouldSkipDatabaseCheck) {
    try {
      // Check if database is initialized
      const dbCheckResponse = await fetch(new URL("/api/db/check", request.url))
      const dbStatus = await dbCheckResponse.json()

      if (!dbStatus.initialized) {
        // Try to initialize the database
        const initResponse = await fetch(new URL("/api/db/init-database", request.url))
        const initData = await initResponse.json()

        if (!initData.success) {
          console.error("Failed to initialize database:", initData.error)
          // Continue anyway, the application will use mock data
        }
      }
    } catch (error) {
      console.error("Database check middleware error:", error)
      // Continue anyway, the application will use mock data
    }
  }

  // Define public paths that don't require authentication
  const isPublicPath =
    path === "/" || path === "/login" || path === "/register" || path === "/forgot-password"

  // Get the session cookie
  const sessionCookie = request.cookies.get("session")?.value

  // If the path is not public and there's no session, redirect to login with reason and return path
  if (!isPublicPath && !sessionCookie) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("reason", "protected")
    loginUrl.searchParams.set("returnTo", path)
    return NextResponse.redirect(loginUrl)
  }

  // If the user is logged in and trying to access login/register pages, redirect to profile
  if (sessionCookie && (path === "/login" || path === "/register")) {
    return NextResponse.redirect(new URL("/profile", request.url))
  }

  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public assets)
     * - api routes that don't require authentication
     */
    "/((?!_next/static|_next/image|favicon.ico|api/auth/login|api/auth/register).*)",
  ],
}
