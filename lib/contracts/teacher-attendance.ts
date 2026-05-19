import { z } from "zod"

export const TEACHER_ATTENDANCE_STATUSES = [
  "present",
  "absent_excused",
  "absent_unexcused",
  "late",
] as const

export const TeacherAttendanceStatusSchema = z.enum(TEACHER_ATTENDANCE_STATUSES)
export type TeacherAttendanceStatus = z.infer<typeof TeacherAttendanceStatusSchema>

export const TeacherAttendanceResponseSchema = z.object({
  id: z.number(),
  teacher_id: z.number(),
  teacher_full_name: z.string(),
  slot_id: z.number().nullable(),
  slot_summary: z.string().nullable(),
  date: z.string(),
  academic_year_id: z.number(),
  status: TeacherAttendanceStatusSchema,
  late_minutes: z.number().int().min(0),
  notes: z.string().nullable(),

  declared_by_user_id: z.number(),
  declared_by_email: z.string().nullable(),
  declared_at: z.string(),
  is_validated: z.boolean(),
  validated_by_user_id: z.number().nullable(),
  validated_by_email: z.string().nullable(),
  validated_at: z.string().nullable(),

  created_at: z.string(),
  updated_at: z.string(),
})

export const TeacherAttendanceListResponseSchema = z.object({
  items: z.array(TeacherAttendanceResponseSchema),
  total: z.number(),
})

export const TeacherAttendanceStatsSchema = z.object({
  teacher_id: z.number(),
  academic_year_id: z.number(),
  academic_year_name: z.string(),

  total_sessions: z.number(),
  sessions_present: z.number(),
  sessions_absent_excused: z.number(),
  sessions_absent_unexcused: z.number(),
  sessions_late: z.number(),

  attendance_rate: z.number(),
  total_late_minutes: z.number(),
  avg_late_minutes_when_late: z.number(),

  pending_validation_count: z.number(),
})

// ---------- Input schemas (forms) ----------

export const TeacherAttendanceCreateSchema = z
  .object({
    slot_id: z.number().int().positive().nullable().optional(),
    date: z.string().min(1, "La date est requise"),
    status: TeacherAttendanceStatusSchema,
    late_minutes: z
      .number({ invalid_type_error: "Minutes en chiffres" })
      .int()
      .min(0, "Doit être >= 0")
      .max(480, "Maximum 8h (480 minutes)")
      .default(0),
    notes: z.string().max(1000, "1000 caractères maximum").nullable().optional(),
  })
  .refine(
    (data) => data.status === "late" || data.late_minutes === 0,
    {
      message: "Les minutes de retard ne s'appliquent qu'au statut 'En retard'",
      path: ["late_minutes"],
    },
  )

export const TeacherSelfDeclareCreateSchema = TeacherAttendanceCreateSchema

export const TeacherAttendanceValidateSchema = z.object({
  approved: z.boolean().default(true),
  admin_notes: z.string().max(500).nullable().optional(),
})

// ---------- Exported types ----------

export type TeacherAttendanceResponse = z.infer<typeof TeacherAttendanceResponseSchema>
export type TeacherAttendanceListResponse = z.infer<typeof TeacherAttendanceListResponseSchema>
export type TeacherAttendanceStats = z.infer<typeof TeacherAttendanceStatsSchema>
export type TeacherAttendanceCreate = z.infer<typeof TeacherAttendanceCreateSchema>
export type TeacherSelfDeclareCreate = z.infer<typeof TeacherSelfDeclareCreateSchema>
export type TeacherAttendanceValidateInput = z.infer<typeof TeacherAttendanceValidateSchema>
