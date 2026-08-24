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

/** Login/refresh enrichis du refresh token capté depuis le cookie BE. */
export type LoginResult = LoginResponse & { refreshToken: string | null }
export type RefreshResult = RefreshResponse & { refreshToken: string | null }

/**
 * Extrait la valeur du cookie `refresh_token` depuis les en-têtes Set-Cookie
 * de la réponse BE. Ces appels tournent côté serveur (NextAuth authorize() et
 * callback jwt, en Node) : le cookie httpOnly posé par le BE n'atteint jamais
 * le navigateur, on le récupère donc ici pour le persister dans le JWT
 * NextAuth chiffré et permettre le refresh silencieux.
 */
function extractRefreshToken(headers: Headers): string | null {
  const raw =
    typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : headers.get("set-cookie")
        ? [headers.get("set-cookie") as string]
        : []
  for (const cookie of raw) {
    const match = cookie.match(/(?:^|;\s*)refresh_token=([^;]+)/)
    if (match) return decodeURIComponent(match[1])
  }
  return null
}

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
  ): Promise<LoginResult> => {
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
    const validated = safeValidate(LoginResponseSchema, data, "/auth/login")
    return { ...validated, refreshToken: extractRefreshToken(res.headers) }
  },

  /**
   * Échange le refresh token contre un nouvel access token (rotation BE).
   *
   * Le BE lit le refresh token depuis le cookie `refresh_token`, on l'envoie
   * donc via l'en-tête `Cookie`. `tenantSlug` (= le claim tenant_id du token,
   * identique au slug) est forwardé en `X-Tenant-Slug` : sans Bearer, c'est
   * ce header que le TenantMiddleware utilise pour scoper la bonne DB, sinon
   * le refresh tombe sur le tenant local et `auth_service.refresh` rejette le
   * mismatch tenant. Le BE pose un refresh token rotaté en Set-Cookie qu'on
   * récupère pour le prochain cycle.
   */
  refresh: async (
    refreshToken: string,
    tenantSlug?: string,
  ): Promise<RefreshResult> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Cookie: `refresh_token=${refreshToken}`,
    }
    if (tenantSlug) headers["X-Tenant-Slug"] = tenantSlug

    const res = await fetch(`${getBaseUrl()}/auth/refresh`, {
      method: "POST",
      headers,
    })
    if (!res.ok) {
      throw new Error("Refresh token expired")
    }
    const data = await res.json()
    const validated = safeValidate(RefreshResponseSchema, data, "/auth/refresh")
    return {
      ...validated,
      refreshToken: extractRefreshToken(res.headers) ?? refreshToken,
    }
  },

  myPermissions: async (): Promise<string[]> => {
    const data = await apiFetch<unknown>("/auth/me/permissions")
    return safeValidate(z.array(z.string()), data, "/auth/me/permissions")
  },
}
