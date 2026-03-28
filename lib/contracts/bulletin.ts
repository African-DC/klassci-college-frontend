import { z } from "zod"

// Miroir de app/schemas/bulletin.py (backend)

export const BulletinStatusSchema = z.enum(["brouillon", "publie"])

export const TrimesterSchema = z.enum(["1", "2", "3"])

export const MentionSchema = z.enum(["Très Bien", "Bien", "Assez Bien", "Passable"])

export const BulletinDecisionSchema = z.enum(["admis", "redouble", "exclu"])

export const SubjectGradeSchema = z.object({
  subject_name: z.string(),
  coefficient: z.number(),
  average: z.number().nullable(),
  coef_x_note: z.number().nullable().optional(),
  class_average: z.number().nullable(),
  teacher_name: z.string(),
  appreciation: z.string().nullable(),
})

export const BulletinSchema = z.object({
  id: z.number(),
  student_id: z.number(),
  student_name: z.string(),
  class_id: z.number(),
  class_name: z.string(),
  trimester: TrimesterSchema,
  academic_year_id: z.number(),
  academic_year_label: z.string(),
  status: BulletinStatusSchema,
  average: z.number().nullable(),
  rank: z.number().nullable(),
  total_students: z.number(),
  mention: MentionSchema.nullable(),
  subject_grades: z.array(SubjectGradeSchema),
  council_decision: BulletinDecisionSchema.nullable().optional(),
  class_council_appreciation: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const BulletinListParamsSchema = z.object({
  class_id: z.number().optional(),
  trimester: TrimesterSchema.optional(),
  academic_year_id: z.number().optional(),
  status: BulletinStatusSchema.optional(),
  page: z.number().optional(),
  per_page: z.number().optional(),
  search: z.string().optional(),
})

export const BulletinGenerateSchema = z.object({
  class_id: z.number({ required_error: "La classe est requise" }).positive(),
  trimester: TrimesterSchema,
  academic_year_id: z.number({ required_error: "L'année académique est requise" }).positive(),
})

export type BulletinStatus = z.infer<typeof BulletinStatusSchema>
export type Trimester = z.infer<typeof TrimesterSchema>
export type Mention = z.infer<typeof MentionSchema>
export type BulletinDecision = z.infer<typeof BulletinDecisionSchema>
export type SubjectGrade = z.infer<typeof SubjectGradeSchema>
export type Bulletin = z.infer<typeof BulletinSchema>
export type BulletinListParams = z.infer<typeof BulletinListParamsSchema>
export type BulletinGenerate = z.infer<typeof BulletinGenerateSchema>
