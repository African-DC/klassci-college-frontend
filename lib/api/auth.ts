import { z } from "zod"
import {
  LoginResponseSchema,
  RefreshResponseSchema,
  type LoginResponse,
  type RefreshResponse,
} from "@/lib/contracts/auth"
import { apiFetch, safeValidate } from "./client"

function getBaseUrl(): string {
  // Server-side (NextAuth authorize() runs in Node): hit the backend directly
  // via the internal address — avoids depending on the public host's DNS/TLS.
  if (typeof window === "undefined") {
    return process.env.INTERNAL_API_URL ?? "http://127.0.0.1:8000"
  }
  // Client-side (e.g. authApi.myPermissions): same-origin relative base.
  const url = process.env.NEXT_PUBLIC_API_URL
  if (!url) throw new Error("NEXT_PUBLIC_API_URL is not defined — check your .env file")
  return url
}

export type { LoginResponse, RefreshResponse }

export const authApi = {
  /**
   * Authenticate against the BE.
   *
   * ``tenantSlug`` is forwarded as ``X-Tenant-Slug`` header so the BE
   * TenantMiddleware knows which tenant DB to query for the user
   * (the JWT does not exist yet at this stage). Without it, the BE
   * falls back to LOCAL_TENANT_ID — fine for super-admin login on
   * ``college.klassci.com``, but client tenant login MUST pass it.
   */
  login: async (
    email: string,
    password: string,
    tenantSlug?: string,
  ): Promise<LoginResponse> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (tenantSlug) headers["X-Tenant-Slug"] = tenantSlug

    const res = await fetch(`${getBaseUrl()}/auth/login`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Erreur serveur" }))
      throw new Error(error.detail || "Identifiants invalides")
    }
    const data = await res.json()
    return safeValidate(LoginResponseSchema, data, "/auth/login")
  },

  refresh: async (refreshToken: string): Promise<RefreshResponse> => {
    const res = await fetch(`${getBaseUrl()}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) {
      throw new Error("Refresh token expired")
    }
    const data = await res.json()
    return safeValidate(RefreshResponseSchema, data, "/auth/refresh")
  },

  myPermissions: async (): Promise<string[]> => {
    const data = await apiFetch<unknown>("/auth/me/permissions")
    return safeValidate(z.array(z.string()), data, "/auth/me/permissions")
  },
}
