import { auth } from "@/auth"
import { NextResponse } from "next/server"

const PORTALS = ["admin", "teacher", "student", "parent"] as const
type Portal = (typeof PORTALS)[number]

const ROLE_TO_PORTAL: Record<string, Portal> = {
  admin: "admin",
  teacher: "teacher",
  student: "student",
  parent: "parent",
}

function getPortalFromPath(pathname: string): Portal | null {
  const segment = pathname.split("/")[1]
  return PORTALS.includes(segment as Portal) ? (segment as Portal) : null
}

function getDefaultRedirect(role: string | undefined): string {
  if (!role) return "/admin/dashboard"
  const portal = ROLE_TO_PORTAL[role]
  return portal ? `/${portal}/dashboard` : "/admin/dashboard"
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const isLoggedIn = !!session?.user

  // Refresh token expired — force re-login
  if (session?.error === "RefreshTokenError" && pathname !== "/login") {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.delete("callbackUrl")
    return NextResponse.redirect(url)
  }

  const portalFromPath = getPortalFromPath(pathname)
  const isProtectedRoute = portalFromPath !== null

  // Not authenticated on protected route:
  // In dev mode, let users browse freely (backend may be offline).
  // In production, redirect to login.
  if (isProtectedRoute && !isLoggedIn) {
    if (process.env.NODE_ENV === "production") {
      const url = req.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(url)
    }
    // Dev mode — let through without auth
    return NextResponse.next()
  }

  // Authenticated on /login → redirect to their portal
  if (pathname === "/login" && isLoggedIn) {
    const dest = getDefaultRedirect(session.user.role)
    if (dest !== "/login") {
      const url = req.nextUrl.clone()
      url.pathname = dest
      return NextResponse.redirect(url)
    }
  }

  // Authenticated but wrong portal → redirect to correct one
  if (isProtectedRoute && isLoggedIn && session.user.role) {
    const expectedPortal = ROLE_TO_PORTAL[session.user.role]
    if (expectedPortal && portalFromPath !== expectedPortal) {
      const url = req.nextUrl.clone()
      url.pathname = getDefaultRedirect(session.user.role)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/login",
    "/admin/:path*",
    "/teacher/:path*",
    "/student/:path*",
    "/parent/:path*",
  ],
}
