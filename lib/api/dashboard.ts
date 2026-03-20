import { DashboardStatsSchema, type DashboardStats } from "@/lib/contracts/dashboard"
import { safeValidate } from "./client"

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL
  if (!url) throw new Error("NEXT_PUBLIC_API_URL is not defined")
  return url
}

export const dashboardApi = {
  stats: async (accessToken?: string): Promise<DashboardStats> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`

    const res = await fetch(`${getBaseUrl()}/dashboard/stats`, { headers })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Erreur serveur" }))
      throw new Error(error.detail || "Impossible de charger les statistiques")
    }
    const data = await res.json()
    return safeValidate(DashboardStatsSchema, data, "/dashboard/stats")
  },
}
