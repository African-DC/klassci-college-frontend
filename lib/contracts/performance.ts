import { z } from "zod"

// Contrats pour la performance enseignant + activité personnel — endpoints
// /admin/performance/* et /teacher/performance/me.

export const PerformanceAxisSchema = z.object({
  key: z.string(),
  label: z.string(),
  weight: z.number(),
  score: z.number().nullable(),
  sufficient: z.boolean(),
  detail: z.record(z.string(), z.unknown()),
})

export const TeacherPerformanceItemSchema = z.object({
  teacher_id: z.number(),
  user_id: z.number().nullable(),
  first_name: z.string(),
  last_name: z.string(),
  speciality: z.string().nullish(),
  photo_url: z.string().nullish(),
  global_score: z.number().nullable(),
  rating: z.string(),
  sufficient: z.boolean(),
  axes: z.array(PerformanceAxisSchema),
})

export const PerformanceSummarySchema = z.object({
  teachers_total: z.number(),
  teachers_scored: z.number(),
  teachers_insufficient: z.number(),
  teachers_avg_score: z.number().nullable(),
  staff_total: z.number(),
  staff_active: z.number(),
})

export const TeacherPerformanceListSchema = z.object({
  academic_year_id: z.number(),
  academic_year_name: z.string(),
  teachers: z.array(TeacherPerformanceItemSchema),
  summary: PerformanceSummarySchema,
})

export const TeacherSelfPerformanceSchema = z.object({
  academic_year_id: z.number(),
  academic_year_name: z.string(),
  performance: TeacherPerformanceItemSchema,
})

export const StaffActivityItemSchema = z.object({
  user_id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  position: z.string().nullish(),
  photo_url: z.string().nullish(),
  payments_count: z.number(),
  payments_amount: z.coerce.number(),
  enrollments_count: z.number(),
  last_login: z.string().nullish(),
})

export const StaffActivityListSchema = z.object({
  academic_year_id: z.number(),
  academic_year_name: z.string(),
  staff: z.array(StaffActivityItemSchema),
})

export type PerformanceAxis = z.infer<typeof PerformanceAxisSchema>
export type TeacherPerformanceItem = z.infer<typeof TeacherPerformanceItemSchema>
export type PerformanceSummary = z.infer<typeof PerformanceSummarySchema>
export type TeacherPerformanceList = z.infer<typeof TeacherPerformanceListSchema>
export type TeacherSelfPerformance = z.infer<typeof TeacherSelfPerformanceSchema>
export type StaffActivityItem = z.infer<typeof StaffActivityItemSchema>
export type StaffActivityList = z.infer<typeof StaffActivityListSchema>
