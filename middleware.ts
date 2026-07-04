import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { extractHostname, isHostAllowed } from "@/lib/utils/allowed-hosts"

const PORTALS = ["admin", "teacher", "student", "parent", "super-admin"] as const
type Portal = (typeof PORTALS)[number]

const ROLE_TO_PORTAL: Record<string, Portal> = {
  admin: "admin",
  teacher: "teacher",
  student: "student",
  parent: "parent",
  super_admin: "super-admin",
}

function getPortalFromPath(pathname: string): Portal | null {
  const segment = pathname.split("/")[1]
  return PORTALS.includes(segment as Portal) ? (segment as Portal) : null
}

// Routes publiques accessibles SANS authentification. Un parent/employeur qui
// scanne le QR code d'un certificat papier arrive sur /verifier/* : il ne doit
// jamais être redirigé vers /login, même s'il porte un cookie de session
// expiré (RefreshTokenError) d'une visite précédente sur le même domaine.
function isPublicRoute(pathname: string): boolean {
  return pathname === "/login" || pathname.startsWith("/verifier")
}

function getDefaultRedirect(role: string | undefined): string {
  if (!role) return "/admin/dashboard"
  if (role === "super_admin") return "/super-admin/tenants"
  const portal = ROLE_TO_PORTAL[role]
  return portal ? `/${portal}/dashboard` : "/admin/dashboard"
}

// Behind a reverse proxy, req.nextUrl defaults to Next's internal origin
// (localhost:3000), so NextResponse.redirect(req.nextUrl.clone()) leaks
// localhost into the Location. We rebuild the absolute URL from the forwarded
// headers (Caddy sets X-Forwarded-Host / X-Forwarded-Proto) so the 307 points
// back at the host the user actually used — works on the https domain and on
// the raw IP in http alike. (A relative Location is not an option: Next's
// middleware runtime parses Location as an absolute URL and throws on a path.)
function hostRedirect(req: NextRequest, pathname: string, search = ""): NextResponse {
  const url = req.nextUrl.clone()
  url.pathname = pathname
  url.search = search
  const fwdHost = req.headers.get("x-forwarded-host") ?? req.headers.get("host")
  const fwdProto = req.headers.get("x-forwarded-proto")
  if (fwdHost) {
    // Split host[:port] explicitly — setting url.host with a port-less value
    // leaves the internal :3000 port in place, producing an unreachable URL.
    const [hostname, port] = fwdHost.split(":")
    url.hostname = hostname
    url.port = port ?? ""
  }
  if (fwdProto) url.protocol = `${fwdProto}:`
  return NextResponse.redirect(url)
}

// NextAuth wrapper qui gère les redirections d'auth + portails.
const authMiddleware = auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  // Check user.id (not just user truthy) : when token.error is set,
  // auth.ts intentionally leaves user fields undefined to avoid
  // propagating stale identity, but the user object itself stays as
  // NextAuth's default empty {}. Truthy-on-{} would falsely report
  // logged in. session.id is the canonical authenticated marker.
  const isLoggedIn = !!session?.user?.id

  if (session?.error === "RefreshTokenError" && !isPublicRoute(pathname)) {
    return hostRedirect(req, "/login")
  }

  // Mot de passe temporaire (compte créé ou réinitialisé par un admin) :
  // forcer l'écran de changement avant tout autre accès.
  if (
    isLoggedIn &&
    session.user.mustChangePassword &&
    pathname !== "/change-password"
  ) {
    return hostRedirect(req, "/change-password")
  }

  const portalFromPath = getPortalFromPath(pathname)
  const isProtectedRoute = portalFromPath !== null

  if (isProtectedRoute && !isLoggedIn) {
    if (process.env.NODE_ENV === "production") {
      return hostRedirect(req, "/login", `?callbackUrl=${encodeURIComponent(pathname)}`)
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
      return hostRedirect(req, dest)
    }
  }

  if (isProtectedRoute && isLoggedIn && session.user.role) {
    const expectedPortal = ROLE_TO_PORTAL[session.user.role]
    if (expectedPortal && portalFromPath !== expectedPortal) {
      return hostRedirect(req, getDefaultRedirect(session.user.role))
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
