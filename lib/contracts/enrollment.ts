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
  student_first_name: z.string().nullable().optional(),
  student_last_name: z.string().nullable().optional(),
  class_name: z.string().nullable().optional(),
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

// --- Multi-step enrollment form schemas ---

export const ParentInputSchema = z.object({
  first_name: z.string().min(1, "Le prenom est requis"),
  last_name: z.string().min(1, "Le nom est requis"),
  phone: z.string().nullable().optional(),
  email: z.string().email("Email invalide").nullable().optional(),
  relationship_type: z.enum(["father", "mother", "guardian", "other"]).default("guardian"),
})

export const NewEnrollmentSchema = z.object({
  type: z.literal("new"),
  // Student info
  first_name: z.string().min(1, "Le prenom est requis"),
  last_name: z.string().min(1, "Le nom est requis"),
  birth_date: z.string().nullable().optional(),
  genre: z.enum(["M", "F"]).nullable().optional(),
  enrollment_number: z.string().nullable().optional(),
  // Parent info (optional)
  parent: ParentInputSchema.nullable().optional(),
  // Class
  class_id: z.number({ required_error: "La classe est requise" }).positive(),
  fee_variant_id: z.number().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export const ReEnrollmentSchema = z.object({
  type: z.literal("re-enrollment"),
  student_id: z.number({ required_error: "L'eleve est requis" }).positive(),
  class_id: z.number({ required_error: "La classe est requise" }).positive(),
  fee_variant_id: z.number().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export const FeeVariantOptionSchema = z.object({
  id: z.number(),
  fee_category_id: z.number(),
  amount: z.coerce.number(),
  description: z.string().nullable(),
})

export type ParentInput = z.infer<typeof ParentInputSchema>
export type NewEnrollment = z.infer<typeof NewEnrollmentSchema>
export type ReEnrollment = z.infer<typeof ReEnrollmentSchema>
export type FeeVariantOption = z.infer<typeof FeeVariantOptionSchema>
