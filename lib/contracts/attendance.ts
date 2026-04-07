import { z } from "zod"

// Miroir de app/schemas/attendance.py (backend)

export const AttendanceStatusSchema = z.enum(["present", "absent", "late", "excused"])

export const AttendanceRecordSchema = z.object({
  id: z.number(),
  student_id: z.number(),
  status: AttendanceStatusSchema,
  time_in: z.string().nullable(),
  time_out: z.string().nullable(),
  source: z.string(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const AttendanceSessionSchema = z.object({
  id: z.number(),
  entity_type: z.string(),
  context_id: z.number(),
  date: z.string(),
  academic_year_id: z.number(),
  records: z.array(AttendanceRecordSchema),
  created_at: z.string(),
  updated_at: z.string(),
})

export const AttendanceStatsSchema = z.object({
  student_id: z.number(),
  student_name: z.string(),
  total_sessions: z.number(),
  present: z.number(),
  absent: z.number(),
  late: z.number(),
  excused: z.number(),
  rate: z.number(),
})

export const AttendanceBatchEntrySchema = z.object({
  student_id: z.number({ required_error: "L'élève est requis" }),
  status: AttendanceStatusSchema,
})

export const AttendanceBatchUpdateSchema = z.object({
  slot_id: z.number({ required_error: "Le créneau est requis" }),
  date: z.string({ required_error: "La date est requise" }),
  records: z.array(AttendanceBatchEntrySchema),
})

export const AttendanceHistoryParamsSchema = z.object({
  class_id: z.number().optional(),
  student_id: z.number().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  status: AttendanceStatusSchema.optional(),
  page: z.number().optional(),
  size: z.number().optional(),
})

export type AttendanceStatus = z.infer<typeof AttendanceStatusSchema>
export type AttendanceRecord = z.infer<typeof AttendanceRecordSchema>
export type AttendanceSession = z.infer<typeof AttendanceSessionSchema>
export type AttendanceStats = z.infer<typeof AttendanceStatsSchema>
export type AttendanceBatchEntry = z.infer<typeof AttendanceBatchEntrySchema>
export type AttendanceBatchUpdate = z.infer<typeof AttendanceBatchUpdateSchema>
export type AttendanceHistoryParams = z.infer<typeof AttendanceHistoryParamsSchema>
