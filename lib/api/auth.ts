import { z } from "zod"
import {
  LoginResponseSchema,
  RefreshResponseSchema,
  type LoginResponse,
  type RefreshResponse,
} from "@/lib/contracts/auth"
import { apiFetch, safeValidate } from "./client"

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL
  if (!url) throw new Error("NEXT_PUBLIC_API_URL is not defined — check your .env file")
  return url
}

export type { LoginResponse, RefreshResponse }

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await fetch(`${getBaseUrl()}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
