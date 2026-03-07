import type { UserRole } from "@/types/next-auth"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL
if (!BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not defined — check your .env file")
}

interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: {
    id: number
    email: string
    role: UserRole
    first_name: string
    last_name: string
  }
}

interface RefreshResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Erreur serveur" }))
      throw new Error(error.detail || "Identifiants invalides")
    }
    return res.json()
  },

  refresh: async (refreshToken: string): Promise<RefreshResponse> => {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) {
      throw new Error("Refresh token expired")
    }
    return res.json()
  },
}
