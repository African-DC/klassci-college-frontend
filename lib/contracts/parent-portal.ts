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
})

// Notes d'un enfant — même structure que les notes élève
export const ParentChildGradeEntrySchema = z.object({
  id: z.number(),
  title: z.string(),
  type: z.enum(["devoir", "interro", "examen", "composition"]),
  date: z.string(),
  coefficient: z.number(),
  value: z.number().nullable(),
  out_of: z.number(),
})

export const ParentChildSubjectGradesSchema = z.object({
  subject_id: z.number(),
  subject_name: z.string(),
  coefficient: z.number(),
  average: z.number().nullable(),
  grades: z.array(ParentChildGradeEntrySchema),
})

export const ParentChildGradesResponseSchema = z.object({
  child_name: z.string(),
  class_name: z.string(),
  trimester: z.string().nullable(),
  general_average: z.number().nullable(),
  rank: z.number().nullable(),
  total_students: z.number(),
  subjects: z.array(ParentChildSubjectGradesSchema),
})

// Frais d'un enfant — même structure que les frais élève
export const ParentChildFeeItemSchema = z.object({
  id: z.number(),
  category_name: z.string(),
  total_amount: z.number(),
  paid_amount: z.number(),
  remaining: z.number(),
  status: z.enum(["paye", "partiel", "impaye"]),
  last_payment_date: z.string().nullish(),
})

export const ParentChildFeesResponseSchema = z.object({
  child_name: z.string(),
  class_name: z.string(),
  academic_year: z.string(),
  total_expected: z.number(),
  total_paid: z.number(),
  total_remaining: z.number(),
  fees: z.array(ParentChildFeeItemSchema),
})

// Bulletins d'un enfant
export const ParentChildBulletinSchema = z.object({
  id: z.number(),
  trimester: z.number(),
  average: z.number().nullable(),
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
