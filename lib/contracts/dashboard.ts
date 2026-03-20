import { z } from "zod"

export const DashboardStatsSchema = z.object({
  enrolled_students: z.number(),
  pending_payments: z.number(),
  courses_today: z.number(),
  alerts: z.number(),
})

export type DashboardStats = z.infer<typeof DashboardStatsSchema>
