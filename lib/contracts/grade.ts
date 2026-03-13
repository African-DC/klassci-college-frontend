import { z } from "zod"

// Miroir de app/schemas/grade.py (backend)

export const EvaluationTypeSchema = z.enum(["devoir", "interro", "examen", "composition"])

export const EvaluationSchema = z.object({
  id: z.number(),
  title: z.string(),
  type: EvaluationTypeSchema,
  date: z.string(),
  coefficient: z.number(),
  subject_id: z.number(),
  subject_name: z.string(),
  class_id: z.number(),
  class_name: z.string(),
  teacher_id: z.number(),
  teacher_name: z.string(),
  total_students: z.number(),
  graded_students: z.number(),
  created_at: z.string(),
})

export const GradeSchema = z.object({
  id: z.number(),
  evaluation_id: z.number(),
  student_id: z.number(),
  student_name: z.string(),
  value: z.number().nullable(),
})

export const EvaluationCreateSchema = z.object({
  title: z.string({ required_error: "Le titre est requis" }).min(1, "Le titre est requis"),
  type: EvaluationTypeSchema,
  date: z.string({ required_error: "La date est requise" }).min(1, "La date est requise"),
  coefficient: z.number({ required_error: "Le coefficient est requis" }).positive("Le coefficient doit etre positif"),
  subject_id: z.number({ required_error: "La matiere est requise" }).positive(),
  class_id: z.number({ required_error: "La classe est requise" }).positive(),
})

export const GradeBatchUpdateSchema = z.object({
  grades: z.array(z.object({
    student_id: z.number(),
    value: z.number().nullable(),
  })),
})

export type EvaluationType = z.infer<typeof EvaluationTypeSchema>
export type Evaluation = z.infer<typeof EvaluationSchema>
export type Grade = z.infer<typeof GradeSchema>
export type EvaluationCreate = z.infer<typeof EvaluationCreateSchema>
export type GradeBatchUpdate = z.infer<typeof GradeBatchUpdateSchema>
