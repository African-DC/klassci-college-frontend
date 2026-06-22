import { getSession, signOut } from "next-auth/react"
import type { Session } from "next-auth"
import type { z } from "zod"

function getBaseUrl(): string {
  // Server-side (route handlers / RSC): call the backend directly so auth and
  // server fetches never depend on the public host's DNS/TLS (no hairpin,
  // no host-pinning). Falls back to the internal address.
  if (typeof window === "undefined") {
    return process.env.INTERNAL_API_URL ?? "http://127.0.0.1:8000"
  }
  // Client-side: same-origin relative base → works on whatever host the app is
  // served from (https domain, raw IP in http, …). No mixed-content, no CORS.
  const url = process.env.NEXT_PUBLIC_API_URL
  if (!url) throw new Error("NEXT_PUBLIC_API_URL is not defined — check your .env file")
  return url
}

// Idempotent flag: when several queries fire in parallel and all return
// 401 because the JWT just expired, we want exactly one signOut + redirect
// — not N. Reset on next module load (full page reload after redirect).
let isHandlingExpiredSession = false

export async function handleExpiredSession(): Promise<void> {
  if (isHandlingExpiredSession) return
  if (typeof window === "undefined") return
  isHandlingExpiredSession = true
  // Invalidate the session cache so subsequent fetches don't pick up
  // the stale token before the redirect happens.
  sessionCache = null
  sessionPromise = null
  // Best-effort toast. Sonner may not be mounted yet on initial render.
  try {
    const { toast } = await import("sonner")
    toast.error("Session expirée", {
      description: "Veuillez vous reconnecter pour continuer.",
    })
  } catch {
    // ignore
  }
  // Belt-and-suspenders: even if signOut hangs or rejects, the redirect
  // must fire — otherwise we get the zombie state observed 2026-05-20
  // (28×401 with the session-token cookie still set, no redirect, UI
  // stays mounted on /admin/*).
  const redirect = () => {
    window.location.href = "/login?expired=1"
  }
  const fallback = window.setTimeout(redirect, 1500)
  try {
    await signOut({ redirect: false })
  } catch {
    // ignore — we redirect regardless
  } finally {
    window.clearTimeout(fallback)
    redirect()
  }
}

interface RequestOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>
  schema?: z.ZodType
}

export function safeValidate<T>(schema: z.ZodType<T>, data: unknown, context: string): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    console.error(`[API] Validation failed for ${context}:`, result.error.issues)
    throw new Error(`Réponse inattendue du serveur pour ${context}`)
  }
  return result.data
}

// Cache getSession() to avoid redundant /api/auth/session round-trips
// when multiple TanStack Query fetches fire in parallel on mount.
const SESSION_CACHE_TTL = 10_000 // 10 seconds — short enough to catch token refresh
let sessionCache: { session: Session | null; timestamp: number } | null = null
let sessionPromise: Promise<Session | null> | null = null

async function getCachedSession(): Promise<Session | null> {
  if (sessionCache && Date.now() - sessionCache.timestamp < SESSION_CACHE_TTL) {
    return sessionCache.session
  }
  // Deduplicate concurrent calls — all parallel fetches share one getSession() call
  if (!sessionPromise) {
    sessionPromise = getSession().then((session) => {
      sessionCache = { session, timestamp: Date.now() }
      sessionPromise = null
      return session
    })
  }
  return sessionPromise
}

async function authHeaders(): Promise<Record<string, string>> {
  const session = await getCachedSession()
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  // auth.ts sets session.error = "RefreshTokenError" when isTokenExpired() is
  // truthy on the next jwt() pass, but it still exposes session.accessToken
  // (the stale JWT). Don't send that to the BE: bail out and trigger the
  // signOut/redirect flow immediately. Middleware would catch it on the next
  // server navigation, but client-side fetches need their own handler.
  if (session?.error === "RefreshTokenError") {
    void handleExpiredSession()
    throw new Error("Session expirée")
  }
  if (session?.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`
  }
  return headers
}

/** Fetch authentifié retournant un Blob (pour téléchargement PDF, Excel, etc.) */
export async function apiFetchBlob(path: string): Promise<Blob> {
  const headers = await authHeaders()
  delete headers["Content-Type"]
  const hadToken = "Authorization" in headers
  const res = await fetch(`${getBaseUrl()}${path}`, { headers })
  if (res.status === 401) {
    // We sent a Bearer that the BE rejected → JWT expired or revoked.
    // Gate on the header we actually sent (not a re-read of the session)
    // so the post-login race — cookie set but getSession() not yet primed,
    // so no Authorization header in the first fetch — doesn't trigger an
    // immediate signOut right after login.
    if (hadToken) {
      void handleExpiredSession()
    }
    throw new Error("Session expirée")
  }
  if (!res.ok) {
    // Surface the BE detail when available so the caller can toast a useful
    // message — see app/routers/_pdf_helpers.py for the JSON {detail} contract.
    const contentType = res.headers.get("content-type") ?? ""
    if (contentType.includes("application/json")) {
      const body = (await res.json().catch(() => null)) as { detail?: string } | null
      if (body?.detail) throw new Error(body.detail)
    }
    throw new Error(`Erreur ${res.status} lors du téléchargement`)
  }
  return res.blob()
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { schema, ...fetchOptions } = options
  const headers = { ...(await authHeaders()), ...fetchOptions.headers }
  const hadToken = "Authorization" in headers
  const res = await fetch(`${getBaseUrl()}${path}`, { ...fetchOptions, headers })

  // 401: the JWT carried in the Authorization header is missing or expired.
  // Gate on the header we actually sent (not a re-read of the session)
  // — the session cache may report `accessToken` truthy even when the BE
  // is rejecting that very token, and re-reading it before deciding can
  // race with handleExpiredSession() clearing the cache. The post-login
  // race (cookie set but no Authorization header yet) is handled by
  // hadToken=false: throwing is enough, the middleware redirects on the
  // next navigation.
  if (res.status === 401) {
    if (hadToken) {
      void handleExpiredSession()
    }
    throw new Error("Session expirée")
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Erreur serveur" }))
    // FastAPI 422 returns detail as array of validation errors
    const detail = error.detail
    let message: string
    if (typeof detail === "string") {
      message = detail
    } else if (Array.isArray(detail)) {
      message = detail.map((d: { msg?: string; loc?: string[] }) => d.msg ?? JSON.stringify(d)).join(", ")
    } else {
      message = `Erreur ${res.status}`
    }
    throw new Error(message)
  }

  if (res.status === 204) return undefined as T
  const data = await res.json()
  return schema ? safeValidate<T>(schema, data, path) : data
}
