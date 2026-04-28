import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { extractHostname, isHostAllowed } from "@/lib/utils/allowed-hosts"

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

// NextAuth wrapper qui gère les redirections d'auth + portails.
const authMiddleware = auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const isLoggedIn = !!session?.user

  if (session?.error === "RefreshTokenError" && pathname !== "/login") {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.delete("callbackUrl")
    return NextResponse.redirect(url)
  }

  const portalFromPath = getPortalFromPath(pathname)
  const isProtectedRoute = portalFromPath !== null

  if (isProtectedRoute && !isLoggedIn) {
    if (process.env.NODE_ENV === "production") {
      const url = req.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // A session in error state (RefreshTokenError) must be allowed to reach /login
  // so the user can sign in again. Otherwise rule 1 above redirects /<portal> →
  // /login while this rule redirects /login → /<portal>, producing an infinite
  // ERR_TOO_MANY_REDIRECTS loop in the browser.
  if (pathname === "/login" && isLoggedIn && !session.error) {
    const dest = getDefaultRedirect(session.user.role)
    if (dest !== "/login") {
      const url = req.nextUrl.clone()
      url.pathname = dest
      return NextResponse.redirect(url)
    }
  }

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

/**
 * Middleware composé :
 *   1. Host allowlist (rejeté en 400 si Host non autorisé) — défense CSRF
 *   2. NextAuth auth() (gestion session + redirections portail)
 *
 * Pourquoi le host check : avec AUTH_TRUST_HOST=true (nécessaire pour le
 * multi-tenant subdomain en NextAuth v5), un attacker contrôlant un sous-domaine
 * arbitraire pourrait minter des cookies d'auth si on ne valide pas l'origine.
 */
export default function middleware(req: NextRequest) {
  const hostname = extractHostname(req.headers.get("host"))
  if (!isHostAllowed(hostname)) {
    return NextResponse.json(
      { detail: "Invalid host", code: "HOST_NOT_ALLOWED" },
      { status: 400 },
    )
  }

  return (authMiddleware as unknown as (r: NextRequest) => Promise<NextResponse> | NextResponse)(req)
}

export const config = {
  // Matche toutes les routes SAUF :
  //   - /api/* (API routes Next.js)
  //   - /_next/static, /_next/image (assets statiques)
  //   - /favicon.ico, /robots.txt, /sitemap.xml
  // Cela permet au host allowlist de tourner sur la racine et toutes les pages.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
}
