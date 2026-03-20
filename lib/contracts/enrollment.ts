import { z } from "zod"

// Miroir de app/schemas/enrollment.py (backend)

export const EnrollmentStatusSchema = z.enum(["affecte", "reaffecte", "non_affecte"])

export const EnrollmentSchema = z.object({
  id: z.number(),
  student_id: z.number(),
  student_name: z.string(),
  class_id: z.number(),
  class_name: z.string(),
  academic_year_id: z.number(),
  academic_year_label: z.string(),
  assignment_status: EnrollmentStatusSchema,
  is_scholarship: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const EnrollmentCreateSchema = z.object({
  student_id: z.number({ required_error: "L'eleve est requis" }).positive("L'eleve est requis"),
  class_id: z.number({ required_error: "La classe est requise" }).positive("La classe est requise"),
  academic_year_id: z.number({ required_error: "L'annee academique est requise" }).positive("L'annee academique est requise"),
  assignment_status: EnrollmentStatusSchema.default("affecte"),
  is_scholarship: z.boolean().default(false),
})

export const EnrollmentUpdateSchema = z.object({
  class_id: z.number().positive().optional(),
  assignment_status: EnrollmentStatusSchema.optional(),
  is_scholarship: z.boolean().optional(),
})

export const EnrollmentListParamsSchema = z.object({
  page: z.number().optional(),
  per_page: z.number().optional(),
  class_id: z.number().optional(),
  status: z.string().optional(),
  academic_year_id: z.number().optional(),
  search: z.string().optional(),
})

export type EnrollmentStatus = z.infer<typeof EnrollmentStatusSchema>
export type Enrollment = z.infer<typeof EnrollmentSchema>
export type EnrollmentCreate = z.infer<typeof EnrollmentCreateSchema>
export type EnrollmentUpdate = z.infer<typeof EnrollmentUpdateSchema>
export type EnrollmentListParams = z.infer<typeof EnrollmentListParamsSchema>
