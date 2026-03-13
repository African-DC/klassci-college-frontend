import { z } from "zod"

// Miroir de app/schemas/student.py (backend)
// TODO: completer quand l'endpoint GET /students est disponible

export const StudentSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  matricule: z.string(),
  class_id: z.number().nullable(),
  class_name: z.string().nullable(),
})

export const StudentCreateSchema = z.object({
  first_name: z.string({ required_error: "Le prenom est requis" }).min(1),
  last_name: z.string({ required_error: "Le nom est requis" }).min(1),
  matricule: z.string({ required_error: "Le matricule est requis" }).min(1),
  class_id: z.number().optional(),
})

export type Student = z.infer<typeof StudentSchema>
export type StudentCreate = z.infer<typeof StudentCreateSchema>
