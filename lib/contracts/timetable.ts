import { z } from "zod"

// Miroir de app/schemas/timetable.py (backend)

export const DaySchema = z.enum([
  "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi",
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
])

export const TimetableSlotSchema = z.object({
  id: z.number(),
  class_id: z.number(),
  class_name: z.string(),
  teacher_id: z.number(),
  teacher_name: z.string(),
  subject_id: z.number(),
  subject_name: z.string(),
  subject_color: z.string().nullish(),
  academic_year_id: z.number(),
  day: DaySchema,
  start_time: z.string(),
  end_time: z.string(),
  room: z.string().nullish(),
})

export const TimetableSlotCreateSchema = z.object({
  class_id: z.number({ required_error: "La classe est requise" }).positive(),
  teacher_id: z.number({ required_error: "L'enseignant est requis" }).positive(),
  subject_id: z.number({ required_error: "La matière est requise" }).positive(),
  academic_year_id: z.number({ required_error: "L'année académique est requise" }).positive(),
  day: DaySchema,
  start_time: z.string({ required_error: "L'heure de début est requise" }).regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format HH:MM"),
  end_time: z.string({ required_error: "L'heure de fin est requise" }).regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format HH:MM"),
  room: z.string().nullish(),
})

export const TimetableSlotUpdateSchema = TimetableSlotCreateSchema.omit({ class_id: true }).partial()

export const GenerateTaskResponseSchema = z.object({
  task_id: z.string().optional(),
  status: z.enum(["pending", "running", "completed", "failed"]),
  message: z.string().optional(),
  result: z.any().optional(),
})

export type Day = z.infer<typeof DaySchema>
export type TimetableSlot = z.infer<typeof TimetableSlotSchema>
export type TimetableSlotCreate = z.infer<typeof TimetableSlotCreateSchema>
export type TimetableSlotUpdate = z.infer<typeof TimetableSlotUpdateSchema>
export type GenerateTaskResponse = z.infer<typeof GenerateTaskResponseSchema>

// ---------------------------------------------------------------------------
// Teacher availability
// ---------------------------------------------------------------------------

export const DayOfWeekSchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
])

export const TeacherAvailabilitySchema = z.object({
  id: z.number(),
  teacher_id: z.number(),
  day: DayOfWeekSchema,
  start_time: z.string(),
  end_time: z.string(),
  available: z.boolean(),
  preferred: z.boolean(),
})

export const TeacherAvailabilityCreateSchema = z.object({
  day: DayOfWeekSchema,
  start_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format HH:MM"),
  end_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format HH:MM"),
  available: z.boolean().default(true),
  preferred: z.boolean().default(false),
})

export const TeacherAvailabilityUpdateSchema = z.object({
  available: z.boolean().optional(),
  preferred: z.boolean().optional(),
})

// ---------------------------------------------------------------------------
// Semaine d'un enseignant
//
// Sert a montrer l'empechement AVANT de choisir l'horaire. `has_declarations`
// porte la regle appliquee par le backend : tant qu'un enseignant n'a rien
// declare il est disponible partout ; des qu'il a declare une plage, seules
// celles de `open` restent ouvertes.
// ---------------------------------------------------------------------------

export const TeacherWeekBusySlotSchema = z.object({
  day: DayOfWeekSchema,
  start_time: z.string(),
  end_time: z.string(),
  kind: z.enum(["course", "unavailable"]),
  label: z.string(),
  class_name: z.string().nullable().optional(),
})

export const TeacherWeekOpenSlotSchema = z.object({
  day: DayOfWeekSchema,
  start_time: z.string(),
  end_time: z.string(),
  preferred: z.boolean(),
})

export const TeacherWeekSchema = z.object({
  teacher_id: z.number(),
  teacher_name: z.string(),
  has_declarations: z.boolean(),
  busy: z.array(TeacherWeekBusySlotSchema),
  open: z.array(TeacherWeekOpenSlotSchema),
})

// Diagnostic pre-generation
export interface TimetableDiagnostic {
  ready: boolean
  class_id: number
  class_name: string
  subjects_without_teacher: { id: number; name: string; hours_per_week: number }[]
  subjects_with_teacher: { id: number; name: string; hours_per_week: number; teacher_id: number; teacher_name: string }[]
  total_hours_required: number
  total_slots_available: number
  manual_slots_count: number
}

export type DayOfWeek = z.infer<typeof DayOfWeekSchema>
export type TeacherAvailability = z.infer<typeof TeacherAvailabilitySchema>
export type TeacherAvailabilityCreate = z.infer<typeof TeacherAvailabilityCreateSchema>
export type TeacherAvailabilityUpdate = z.infer<typeof TeacherAvailabilityUpdateSchema>
export type TeacherWeekBusySlot = z.infer<typeof TeacherWeekBusySlotSchema>
export type TeacherWeekOpenSlot = z.infer<typeof TeacherWeekOpenSlotSchema>
export type TeacherWeek = z.infer<typeof TeacherWeekSchema>
