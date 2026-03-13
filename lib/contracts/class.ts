import { z } from "zod"

// Miroir de app/schemas/class.py (backend)
// TODO: completer quand l'endpoint GET /classes est disponible

export const ClassSchema = z.object({
  id: z.number(),
  name: z.string(),
  level: z.string(),
  academic_year_id: z.number(),
  student_count: z.number(),
})

export const ClassCreateSchema = z.object({
  name: z.string({ required_error: "Le nom est requis" }).min(1),
  level: z.string({ required_error: "Le niveau est requis" }).min(1),
  academic_year_id: z.number({ required_error: "L'annee academique est requise" }).positive(),
})

export type Class = z.infer<typeof ClassSchema>
export type ClassCreate = z.infer<typeof ClassCreateSchema>
