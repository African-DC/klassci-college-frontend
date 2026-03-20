import { DashboardStatsSchema, type DashboardStats } from "@/lib/contracts/dashboard"
import { apiFetch } from "./client"

export const dashboardApi = {
  stats: async (): Promise<DashboardStats> =>
    apiFetch("/dashboard/stats", { schema: DashboardStatsSchema }),
}
