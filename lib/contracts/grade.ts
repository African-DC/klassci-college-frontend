import { z } from "zod"

// Miroir de app/schemas/grade.py (backend)

export const EvaluationTypeSchema = z.enum(["controle", "devoir", "examen", "oral"])

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
  academic_year_id: z.number(),
  trimester: z.number(),
  total_students: z.number(),
  graded_students: z.number(),
  created_at: z.string(),
})

export const GradeSchema = z.object({
  student_id: z.number(),
  student_name: z.string(),
  value: z.coerce.number().nullable(),
  status: z.string(),
})

export const EvaluationCreateSchema = z.object({
  title: z.string({ required_error: "Le titre est requis" }).min(1, "Le titre est requis"),
  type: EvaluationTypeSchema,
  date: z.string({ required_error: "La date est requise" }).min(1, "La date est requise"),
  coefficient: z
    .number({ required_error: "Le coefficient est requis" })
    .int("Le coefficient doit être entier")
    .min(1, "Coefficient minimum 1")
    .max(10, "Coefficient maximum 10"),
  subject_id: z.number({ required_error: "La matière est requise" }).positive(),
  class_id: z.number({ required_error: "La classe est requise" }).positive(),
  academic_year_id: z.number({ required_error: "L'année scolaire est requise" }).positive(),
  trimester: z
    .number({ required_error: "Le trimestre est requis" })
    .int()
    .min(1)
    .max(3),
  // Optional — auto-resolved BE-side when an enseignant créé.
  // Required when an admin/staff délégué créé pour un prof.
  teacher_id: z.number().positive().nullish(),
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
