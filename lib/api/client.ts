import { getSession } from "next-auth/react"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL

if (!BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not defined — check your .env file")
}

interface RequestOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>
}

async function authHeaders(): Promise<Record<string, string>> {
  const session = await getSession()
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (session?.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`
  }
  return headers
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = { ...(await authHeaders()), ...options.headers }
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Erreur serveur" }))
    throw new Error(error.detail || `Erreur ${res.status}`)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}
