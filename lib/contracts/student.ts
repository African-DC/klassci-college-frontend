import { z } from "zod"

// Inscription année courante de l'élève (status valide).
// Au plus 1 par élève (UniqueConstraint BE), null si non inscrit cette année.
export const CurrentEnrollmentInfoSchema = z.object({
  enrollment_id: z.number(),
  class_id: z.number(),
  class_name: z.string(),
  status: z.string(),
})

export const StudentSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  birth_date: z.string().nullish(),
  genre: z.enum(["M", "F"]).nullish(),
  enrollment_number: z.string().nullish(),
  city: z.string().nullish(),
  commune: z.string().nullish(),
  photo_url: z.string().nullable().optional(),
  user_id: z.number().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  current_enrollment: CurrentEnrollmentInfoSchema.nullish(),
}).passthrough()

// Counts pour la barre de filtre-chips.
export const StudentClassFilterCountSchema = z.object({
  class_id: z.number(),
  class_name: z.string(),
  count: z.number(),
})

export const StudentFiltersSchema = z.object({
  total: z.number(),
  by_class: z.array(StudentClassFilterCountSchema),
  no_current_enrollment_count: z.number(),
  current_academic_year_id: z.number().nullable(),
})

export const StudentCreateSchema = z.object({
  first_name: z.string({ required_error: "Le prénom est requis" }).min(1, "Le prénom est requis"),
  last_name: z.string({ required_error: "Le nom est requis" }).min(1, "Le nom est requis"),
  email: z.string({ required_error: "L'email est requis" }).email("Email invalide"),
  password: z.string({ required_error: "Le mot de passe est requis" }).min(8, "8 caractères minimum"),
  birth_date: z.string().optional(),
  genre: z.enum(["M", "F"]).optional(),
  enrollment_number: z.string().optional(),
  city: z.string().optional(),
  commune: z.string().optional(),
})

export const StudentUpdateSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  birth_date: z.string().optional(),
  genre: z.enum(["M", "F"]).optional(),
  enrollment_number: z.string().optional(),
  city: z.string().optional(),
  commune: z.string().optional(),
})

export const StudentListParamsSchema = z.object({
  page: z.number().optional(),
  size: z.number().optional(),
  search: z.string().optional(),
  genre: z.string().optional(),
  class_id: z.number().optional(),
  unenrolled_only: z.boolean().optional(),
})

export type CurrentEnrollmentInfo = z.infer<typeof CurrentEnrollmentInfoSchema>
export type StudentClassFilterCount = z.infer<typeof StudentClassFilterCountSchema>
export type StudentFilters = z.infer<typeof StudentFiltersSchema>
export type Student = z.infer<typeof StudentSchema>
export type StudentCreate = z.infer<typeof StudentCreateSchema>
export type StudentUpdate = z.infer<typeof StudentUpdateSchema>
export type StudentListParams = z.infer<typeof StudentListParamsSchema>
