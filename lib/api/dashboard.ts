import {
  DashboardStatsSchema,
  DashboardActivitySchema,
  AdminSummarySchema,
  type DashboardStats,
  type DashboardActivity,
  type AdminSummary,
} from "@/lib/contracts/dashboard"
import { apiFetch } from "./client"

export const dashboardApi = {
  stats: async (): Promise<DashboardStats> =>
    apiFetch("/dashboard/stats", { schema: DashboardStatsSchema }),

  activity: async (): Promise<DashboardActivity> =>
    apiFetch("/dashboard/activity", { schema: DashboardActivitySchema }),

  summary: async (): Promise<AdminSummary> =>
    apiFetch("/dashboard/summary", { schema: AdminSummarySchema }),
}
