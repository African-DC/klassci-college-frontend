import { z } from "zod"

export const timetableSlotSchema = z.object({
  class_id: z.number({ required_error: "La classe est requise" }).positive(),
  teacher_id: z.number({ required_error: "L'enseignant est requis" }).positive(),
  subject_id: z.number({ required_error: "La matiere est requise" }).positive(),
  day: z.enum(["lundi", "mardi", "mercredi", "jeudi", "vendredi"], {
    required_error: "Le jour est requis",
  }),
  start_time: z.string({ required_error: "L'heure de debut est requise" }).regex(/^\d{2}:\d{2}$/, "Format HH:MM"),
  end_time: z.string({ required_error: "L'heure de fin est requise" }).regex(/^\d{2}:\d{2}$/, "Format HH:MM"),
  room: z.string().optional(),
})

export type TimetableSlotInput = z.infer<typeof timetableSlotSchema>
