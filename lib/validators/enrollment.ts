import { z } from "zod"

export const enrollmentCreateSchema = z.object({
  student_id: z.number({ required_error: "L'eleve est requis" }).positive("L'eleve est requis"),
  class_id: z.number({ required_error: "La classe est requise" }).positive("La classe est requise"),
  academic_year_id: z.number({ required_error: "L'annee academique est requise" }).positive("L'annee academique est requise"),
  assignment_status: z.enum(["affecte", "reaffecte", "non_affecte"], {
    required_error: "Le statut est requis",
  }),
  is_scholarship: z.boolean().default(false),
})

export type EnrollmentCreateInput = z.infer<typeof enrollmentCreateSchema>

export const enrollmentUpdateSchema = z.object({
  class_id: z.number().positive().optional(),
  assignment_status: z.enum(["affecte", "reaffecte", "non_affecte"]).optional(),
  is_scholarship: z.boolean().optional(),
})

export type EnrollmentUpdateInput = z.infer<typeof enrollmentUpdateSchema>
