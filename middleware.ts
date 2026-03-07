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

function getDefaultRedirect(role: string): string {
  const portal = ROLE_TO_PORTAL[role]
  return portal ? `/${portal}/dashboard` : "/login"
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const isLoggedIn = !!session?.user
  const hasRefreshError = session?.error === "RefreshTokenError"

  // Refresh token expired — force re-login
  if (hasRefreshError && pathname !== "/login") {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.delete("callbackUrl")
    return NextResponse.redirect(url)
  }

  const portalFromPath = getPortalFromPath(pathname)
  const isProtectedRoute = portalFromPath !== null

  // Not authenticated on protected route → redirect to login
  if (isProtectedRoute && !isLoggedIn) {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  // Authenticated on /login → redirect to their portal
  if (pathname === "/login" && isLoggedIn) {
    const url = req.nextUrl.clone()
    url.pathname = getDefaultRedirect(session.user.role)
    return NextResponse.redirect(url)
  }

  // Authenticated but wrong portal → redirect to correct one
  if (isProtectedRoute && isLoggedIn) {
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
    "/dashboard/:path*",
    "/enrollments/:path*",
    "/grades/:path*",
    "/timetable/:path*",
  ],
}
