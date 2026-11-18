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

  /** Sans année, les inscriptions comptées sont celles de l'année en cours. */
  summary: async (academicYearId?: number): Promise<AdminSummary> =>
    apiFetch(
      academicYearId != null
        ? `/dashboard/summary?academic_year_id=${academicYearId}`
        : "/dashboard/summary",
      { schema: AdminSummarySchema },
    ),
}
