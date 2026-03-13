import { getSession } from "next-auth/react"
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

async function authHeaders(): Promise<Record<string, string>> {
  const session = await getSession()
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (session?.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`
  }
  return headers
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { schema, ...fetchOptions } = options
  const headers = { ...(await authHeaders()), ...fetchOptions.headers }
  const res = await fetch(`${getBaseUrl()}${path}`, { ...fetchOptions, headers })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Erreur serveur" }))
    throw new Error(error.detail || `Erreur ${res.status}`)
  }

  if (res.status === 204) return undefined as T
  const data = await res.json()
  return schema ? schema.parse(data) : data
}
