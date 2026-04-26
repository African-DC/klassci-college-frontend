import { getSession } from "next-auth/react"
import type { Session } from "next-auth"
import type { z } from "zod"

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL
  if (!url) throw new Error("NEXT_PUBLIC_API_URL is not defined — check your .env file")
  return url
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
  if (session?.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`
  }
  return headers
}

/** Fetch authentifié retournant un Blob (pour téléchargement PDF, Excel, etc.) */
export async function apiFetchBlob(path: string): Promise<Blob> {
  const headers = await authHeaders()
  delete headers["Content-Type"]
  const res = await fetch(`${getBaseUrl()}${path}`, { headers })
  if (!res.ok) throw new Error(`Erreur ${res.status} lors du téléchargement`)
  return res.blob()
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { schema, ...fetchOptions } = options
  const headers = { ...(await authHeaders()), ...fetchOptions.headers }
  const res = await fetch(`${getBaseUrl()}${path}`, { ...fetchOptions, headers })

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
