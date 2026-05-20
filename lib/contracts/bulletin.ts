import { z } from "zod"

// Miroir de app/schemas/bulletin.py (backend)

export const MentionSchema = z.enum(["TB", "B", "AB", "P", "M"])

export const BulletinDecisionSchema = z.enum(["passage", "repechage", "redoublement", "exclusion"])

export const SubjectAverageResponseSchema = z.object({
  subject_id: z.number(),
  subject_name: z.string(),
  average: z.coerce.number(),
  coefficient: z.number(),
})

export const BulletinSchema = z.object({
  id: z.number(),
  student_id: z.number(),
  student_name: z.string(),
  student_photo_url: z.string().nullish(),
  student_enrollment_number: z.string().nullish(),
  class_id: z.number(),
  class_name: z.string(),
  academic_year_id: z.number(),
  trimester: z.number(),
  average: z.coerce.number().nullable(),
  rank: z.number().nullable(),
  total_students: z.number(),
  mention: MentionSchema.nullable(),
  file_url: z.string().nullable(),
  generated_at: z.string().nullable(),
  is_published: z.boolean(),
  teacher_comment: z.string().nullable(),
  council_decision: BulletinDecisionSchema.nullable().optional(),
  subject_averages: z.array(SubjectAverageResponseSchema),
  created_at: z.string(),
  updated_at: z.string(),
})

export const BulletinListParamsSchema = z.object({
  class_id: z.number().optional(),
  trimester: z.number().optional(),
  academic_year_id: z.number().optional(),
  is_published: z.boolean().optional(),
  page: z.number().optional(),
  size: z.number().optional(),
  search: z.string().optional(),
})

export const BulletinGenerateSchema = z.object({
  class_id: z.number({ required_error: "La classe est requise" }).positive(),
  trimester: z.number({ required_error: "Le trimestre est requis" }).min(1).max(3),
  academic_year_id: z.number({ required_error: "L'année académique est requise" }).positive(),
})

export type Mention = z.infer<typeof MentionSchema>
export type BulletinDecision = z.infer<typeof BulletinDecisionSchema>
export type Bulletin = z.infer<typeof BulletinSchema>
export type BulletinListParams = z.infer<typeof BulletinListParamsSchema>
export type BulletinGenerate = z.infer<typeof BulletinGenerateSchema>
export type SubjectAverageResponse = z.infer<typeof SubjectAverageResponseSchema>
