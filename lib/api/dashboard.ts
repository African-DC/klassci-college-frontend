import {
  DashboardStatsSchema,
  DashboardActivitySchema,
  type DashboardStats,
  type DashboardActivity,
} from "@/lib/contracts/dashboard"
import { apiFetch } from "./client"

export const dashboardApi = {
  stats: async (): Promise<DashboardStats> =>
    apiFetch("/dashboard/stats", { schema: DashboardStatsSchema }),

  activity: async (): Promise<DashboardActivity> =>
    apiFetch("/dashboard/activity", { schema: DashboardActivitySchema }),
}
