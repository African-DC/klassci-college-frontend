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

// Agrégats KPI calculés côté serveur (GET /dashboard/summary). Justes quelle
// que soit la volumétrie (pas de cap pagination size<=100).
export const AdminSummarySchema = z.object({
  classes: z.object({
    total: z.number().default(0),
    enrolled: z.number().default(0),
    capacity: z.number().default(0),
    full: z.number().default(0),
  }),
  teachers: z.object({
    total: z.number().default(0),
    with_speciality: z.number().default(0),
    with_phone: z.number().default(0),
    without_speciality: z.number().default(0),
  }),
  staff: z.object({
    total: z.number().default(0),
    distinct_positions: z.number().default(0),
    with_phone: z.number().default(0),
    without_position: z.number().default(0),
  }),
  parents: z.object({
    total: z.number().default(0),
    with_account: z.number().default(0),
    with_email: z.number().default(0),
    without_account: z.number().default(0),
  }),
  rooms: z.object({
    total: z.number().default(0),
    capacity: z.number().default(0),
    classrooms: z.number().default(0),
    classes_without_room: z.number().default(0),
  }),
  subjects: z.object({
    unique_names: z.number().default(0),
    instances: z.number().default(0),
    without_teacher: z.number().default(0),
    total_hours: z.number().default(0),
  }),
  enrollments: z.object({
    total: z.number().default(0),
    valid: z.number().default(0),
    pending: z.number().default(0),
    closed: z.number().default(0),
  }),
})

export type AdminSummary = z.infer<typeof AdminSummarySchema>
