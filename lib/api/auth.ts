import {
  LoginResponseSchema,
  RefreshResponseSchema,
  type LoginResponse,
  type RefreshResponse,
} from "@/lib/contracts/auth"

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
    return LoginResponseSchema.parse(data)
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
    return RefreshResponseSchema.parse(data)
  },
}
