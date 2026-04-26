import { z } from "zod"
import { apiFetch, safeValidate } from "./client"
import {
  EvaluationSchema,
  GradeSchema,
  type Evaluation,
  type Grade,
  type EvaluationCreate,
  type GradeBatchUpdate,
} from "@/lib/contracts/grade"

export type { Evaluation, Grade, EvaluationCreate, GradeBatchUpdate }

const EvaluationArraySchema = z.array(EvaluationSchema)
const GradeArraySchema = z.array(GradeSchema)

export const gradesApi = {
  listEvaluations: async (classId: number): Promise<Evaluation[]> => {
    const json = await apiFetch<{ data?: Evaluation[] } | Evaluation[]>(
      `/evaluations?class_id=${classId}`,
    )
    const arr = Array.isArray(json) ? json : json.data ?? []
    return safeValidate(EvaluationArraySchema, arr, `/evaluations?class_id=${classId}`)
  },

  listByTeacher: async (teacherId: number): Promise<Evaluation[]> => {
    const json = await apiFetch<{ data?: Evaluation[] } | Evaluation[]>(
      `/evaluations?teacher_id=${teacherId}`,
    )
    const arr = Array.isArray(json) ? json : json.data ?? []
    return safeValidate(EvaluationArraySchema, arr, `/evaluations?teacher_id=${teacherId}`)
  },

  getGrades: async (evaluationId: number): Promise<Grade[]> => {
    const json = await apiFetch<Grade[]>(
      `/grades?evaluation_id=${evaluationId}`,
    )
    const arr = Array.isArray(json) ? json : []
    return safeValidate(GradeArraySchema, arr, `/grades?evaluation_id=${evaluationId}`)
  },

  createEvaluation: async (data: EvaluationCreate): Promise<Evaluation> => {
    const json = await apiFetch<{ data?: Evaluation } | Evaluation>(
      `/evaluations`,
      { method: "POST", body: JSON.stringify(data) },
    )
    const evaluation = (json as { data?: Evaluation }).data ?? (json as Evaluation)
    return safeValidate(EvaluationSchema, evaluation, "POST /evaluations")
  },

  updateGrades: async (evaluationId: number, data: GradeBatchUpdate): Promise<Grade[]> => {
    const json = await apiFetch<Grade[]>(
      `/grades/${evaluationId}`,
      { method: "PATCH", body: JSON.stringify(data) },
    )
    const arr = Array.isArray(json) ? json : []
    return safeValidate(GradeArraySchema, arr, `PATCH /grades/${evaluationId}`)
  },
}
