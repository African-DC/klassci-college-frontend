import { z } from "zod"

// Contrats pour le portail parent — endpoints /parent/*

// Enfant inscrit (résumé)
export const ParentChildSchema = z.object({
  id: z.number(),
  full_name: z.string(),
  class_name: z.string(),
  general_average: z.number().nullable(),
  total_absences: z.number(),
  fees_remaining: z.number(),
})

// Dashboard parent — résumé global
export const ParentDashboardSchema = z.object({
  parent_name: z.string(),
  total_children: z.number(),
  children: z.array(ParentChildSchema),
  current_academic_year: z.string().nullish(),
})

// Notes d'un enfant — même structure que les notes élève.
// `value`, `average`, montants → `z.coerce.number()` car le BE sérialise
// les Decimal Pydantic en string JSON par défaut.
export const ParentChildGradeEntrySchema = z.object({
  id: z.number(),
  title: z.string(),
  type: z.enum(["devoir", "interro", "examen", "composition"]),
  date: z.string(),
  coefficient: z.number(),
  value: z.coerce.number().nullable(),
  out_of: z.coerce.number(),
})

export const ParentChildSubjectGradesSchema = z.object({
  subject_id: z.number(),
  subject_name: z.string(),
  coefficient: z.number(),
  average: z.coerce.number().nullable(),
  grades: z.array(ParentChildGradeEntrySchema),
})

export const ParentChildGradesResponseSchema = z.object({
  child_name: z.string(),
  class_name: z.string(),
  trimester: z.string().nullable(),
  general_average: z.coerce.number().nullable(),
  rank: z.number().nullable(),
  total_students: z.number(),
  subjects: z.array(ParentChildSubjectGradesSchema),
})

// Frais d'un enfant — même structure que les frais élève
export const ParentChildFeeItemSchema = z.object({
  id: z.number(),
  category_name: z.string(),
  total_amount: z.coerce.number(),
  paid_amount: z.coerce.number(),
  remaining: z.coerce.number(),
  status: z.enum(["paye", "partiel", "impaye"]),
  last_payment_date: z.string().nullish(),
})

export const ParentChildFeesResponseSchema = z.object({
  child_name: z.string(),
  class_name: z.string(),
  academic_year: z.string(),
  total_expected: z.coerce.number(),
  total_paid: z.coerce.number(),
  total_remaining: z.coerce.number(),
  fees: z.array(ParentChildFeeItemSchema),
})

// Bulletins d'un enfant
export const ParentChildBulletinSchema = z.object({
  id: z.number(),
  trimester: z.number(),
  average: z.coerce.number().nullable(),
  rank: z.number().nullable(),
  mention: z.string().nullable(),
  class_name: z.string(),
  academic_year_name: z.string(),
  is_published: z.boolean(),
  generated_at: z.string().nullable(),
})

export const ParentChildBulletinsResponseSchema = z.object({
  student_id: z.number(),
  bulletins: z.array(ParentChildBulletinSchema),
})

// Types inférés
export type ParentChild = z.infer<typeof ParentChildSchema>
export type ParentDashboard = z.infer<typeof ParentDashboardSchema>
export type ParentChildGradeEntry = z.infer<typeof ParentChildGradeEntrySchema>
export type ParentChildSubjectGrades = z.infer<typeof ParentChildSubjectGradesSchema>
export type ParentChildGradesResponse = z.infer<typeof ParentChildGradesResponseSchema>
export type ParentChildFeeItem = z.infer<typeof ParentChildFeeItemSchema>
export type ParentChildFeesResponse = z.infer<typeof ParentChildFeesResponseSchema>
export type ParentChildBulletin = z.infer<typeof ParentChildBulletinSchema>
export type ParentChildBulletinsResponse = z.infer<typeof ParentChildBulletinsResponseSchema>
