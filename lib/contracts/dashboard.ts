import { z } from "zod"

export const DashboardStatsSchema = z.object({
  enrolled_students: z.number(),
  enrollment_validated: z.number().optional().default(0),
  enrollment_prospect: z.number().optional().default(0),
  enrollment_pending: z.number().optional().default(0),
  pending_payments: z.number(),
  courses_today: z.number(),
  alerts: z.number(),
})

export type DashboardStats = z.infer<typeof DashboardStatsSchema>

export const ActivityItemSchema = z.object({
  id: z.number(),
  entity_type: z.string(),
  action: z.string(),
  description: z.string(),
  user_name: z.string().nullable().optional(),
  created_at: z.string(),
})

export const DashboardActivitySchema = z.object({
  items: z.array(ActivityItemSchema),
})

export type ActivityItem = z.infer<typeof ActivityItemSchema>
export type DashboardActivity = z.infer<typeof DashboardActivitySchema>
