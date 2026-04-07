import { z } from "zod"

// Miroir de app/schemas/enrollment.py (backend)

export const EnrollmentStatusSchema = z.enum(["prospect", "en_validation", "valide", "rejete", "annule"])

export const EnrollmentSchema = z.object({
  id: z.number(),
  student_id: z.number(),
  class_id: z.number(),
  academic_year_id: z.number(),
  academic_year_name: z.string(),
  status: EnrollmentStatusSchema,
  fee_variant_id: z.number().nullable(),
  notes: z.string().nullable(),
  created_by: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const EnrollmentCreateSchema = z.object({
  student_id: z.number({ required_error: "L'élève est requis" }).positive("L'élève est requis"),
  class_id: z.number({ required_error: "La classe est requise" }).positive("La classe est requise"),
  academic_year_id: z.number({ required_error: "L'année académique est requise" }).positive("L'année académique est requise"),
  fee_variant_id: z.number().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const EnrollmentUpdateSchema = z.object({
  status: EnrollmentStatusSchema.optional(),
  notes: z.string().optional().nullable(),
})

export const EnrollmentListParamsSchema = z.object({
  page: z.number().optional(),
  size: z.number().optional(),
  class_id: z.number().optional(),
  status: z.string().optional(),
  academic_year_id: z.number().optional(),
})

export type EnrollmentStatus = z.infer<typeof EnrollmentStatusSchema>
export type Enrollment = z.infer<typeof EnrollmentSchema>
export type EnrollmentCreate = z.infer<typeof EnrollmentCreateSchema>
export type EnrollmentUpdate = z.infer<typeof EnrollmentUpdateSchema>
export type EnrollmentListParams = z.infer<typeof EnrollmentListParamsSchema>
