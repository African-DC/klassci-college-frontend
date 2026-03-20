import { z } from "zod"

// Miroir de app/schemas/timetable.py (backend)

export const DaySchema = z.enum(["lundi", "mardi", "mercredi", "jeudi", "vendredi"])

export const TimetableSlotSchema = z.object({
  id: z.number(),
  class_id: z.number(),
  class_name: z.string(),
  teacher_id: z.number(),
  teacher_name: z.string(),
  subject_id: z.number(),
  subject_name: z.string(),
  day: DaySchema,
  start_time: z.string(),
  end_time: z.string(),
  room: z.string().nullish(),
})

export const TimetableSlotCreateSchema = z.object({
  class_id: z.number({ required_error: "La classe est requise" }).positive(),
  teacher_id: z.number({ required_error: "L'enseignant est requis" }).positive(),
  subject_id: z.number({ required_error: "La matiere est requise" }).positive(),
  day: DaySchema,
  start_time: z.string({ required_error: "L'heure de debut est requise" }).regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format HH:MM"),
  end_time: z.string({ required_error: "L'heure de fin est requise" }).regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format HH:MM"),
  room: z.string().nullish(),
})

export const TimetableSlotUpdateSchema = TimetableSlotCreateSchema.omit({ class_id: true }).partial()

export const GenerateTaskResponseSchema = z.object({
  task_id: z.string(),
  status: z.enum(["pending", "running", "completed", "failed"]),
  message: z.string().optional(),
})

export type Day = z.infer<typeof DaySchema>
export type TimetableSlot = z.infer<typeof TimetableSlotSchema>
export type TimetableSlotCreate = z.infer<typeof TimetableSlotCreateSchema>
export type TimetableSlotUpdate = z.infer<typeof TimetableSlotUpdateSchema>
export type GenerateTaskResponse = z.infer<typeof GenerateTaskResponseSchema>
