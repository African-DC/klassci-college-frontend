import { z } from "zod"

export const ParentSchema = z.object({
  id: z.number(),
  user_id: z.number().nullable(),
  first_name: z.string(),
  last_name: z.string(),
  phone: z.string().nullish(),
  email: z.string().nullish(),
  city: z.string().nullish(),
  commune: z.string().nullish(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
}).passthrough()

export const ParentCreateSchema = z.object({
  first_name: z.string({ required_error: "Le prénom est requis" }).min(1),
  last_name: z.string({ required_error: "Le nom est requis" }).min(1),
  phone: z.string().optional(),
  email: z.string().email("Email invalide").optional(),
  password: z.string().min(8, "8 caractères minimum").optional(),
  relationship_type: z.enum(["father", "mother", "guardian", "other"]).default("guardian"),
  city: z.string().optional(),
  commune: z.string().optional(),
})

export const ParentUpdateSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  city: z.string().optional(),
  commune: z.string().optional(),
})

// Enfant lié enrichi (endpoint /admin/parents/{id}/full). Pas de `.default()` :
// le safeValidate du projet ne tolère pas la divergence input/output des defaults.
export const ParentChildSchema = z.object({
  student_id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  student_name: z.string(),
  matricule: z.string().nullish(),
  photo_url: z.string().nullish(),
  relationship_type: z.string(),
  class_name: z.string().nullish(),
  enrollment_status: z.string().nullish(),
  is_enrolled: z.boolean(),
  fees_expected: z.coerce.number(),
  fees_paid: z.coerce.number(),
  fees_balance: z.coerce.number(),
})

export const ParentSummarySchema = z.object({
  children_count: z.number(),
  enrolled_count: z.number(),
  total_expected: z.coerce.number(),
  total_paid: z.coerce.number(),
  total_balance: z.coerce.number(),
  academic_year_name: z.string().nullish(),
})

export const ParentFullSchema = ParentSchema.extend({
  user_email: z.string().nullish(),
  user_is_active: z.boolean().nullish(),
  user_last_login: z.string().nullish(),
  children: z.array(ParentChildSchema),
  summary: ParentSummarySchema,
})

export type Parent = z.infer<typeof ParentSchema>
export type ParentCreate = z.infer<typeof ParentCreateSchema>
export type ParentUpdate = z.infer<typeof ParentUpdateSchema>
export type ParentChild = z.infer<typeof ParentChildSchema>
export type ParentFull = z.infer<typeof ParentFullSchema>
