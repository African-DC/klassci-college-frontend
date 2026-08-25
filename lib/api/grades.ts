import { z } from "zod"
import { apiFetch, safeValidate } from "./client"
import {
  EvaluationSchema,
  EvaluationListResponseSchema,
  GradeSchema,
  type Evaluation,
  type EvaluationListResponse,
  type Grade,
  type EvaluationCreate,
  type GradeBatchUpdate,
} from "@/lib/contracts/grade"

export type { Evaluation, EvaluationListResponse, Grade, EvaluationCreate, GradeBatchUpdate }

const GradeArraySchema = z.array(GradeSchema)

/**
 * Plafond de page du backend. Une classe compte quelques dizaines
 * d'évaluations par année : une seule page les couvre en pratique, et
 * `total` dit toujours la vérité quand ce n'est pas le cas.
 */
export const EVALUATIONS_MAX_PAGE_SIZE = 100

export interface EvaluationListQuery {
  page?: number
  size?: number
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value))
  }
  return search.toString()
}

export const gradesApi = {
  listEvaluations: async (
    classId: number,
    query: EvaluationListQuery = {},
  ): Promise<EvaluationListResponse> => {
    const qs = buildQuery({
      class_id: classId,
      page: query.page ?? 1,
      size: query.size ?? EVALUATIONS_MAX_PAGE_SIZE,
    })
    const json = await apiFetch<unknown>(`/evaluations?${qs}`)
    return safeValidate(EvaluationListResponseSchema, json, `/evaluations?${qs}`)
  },

  listByTeacher: async (
    teacherId: number,
    query: EvaluationListQuery = {},
  ): Promise<EvaluationListResponse> => {
    const qs = buildQuery({
      teacher_id: teacherId,
      page: query.page ?? 1,
      size: query.size ?? EVALUATIONS_MAX_PAGE_SIZE,
    })
    const json = await apiFetch<unknown>(`/evaluations?${qs}`)
    return safeValidate(EvaluationListResponseSchema, json, `/evaluations?${qs}`)
  },

  /** Une évaluation seule — la liste de la classe n'a pas à être chargée pour ça. */
  getEvaluation: async (evaluationId: number): Promise<Evaluation> => {
    const json = await apiFetch<unknown>(`/evaluations/${evaluationId}`)
    return safeValidate(EvaluationSchema, json, `/evaluations/${evaluationId}`)
  },

  getGrades: async (evaluationId: number): Promise<Grade[]> => {
    const json = await apiFetch<unknown>(`/grades?evaluation_id=${evaluationId}`)
    return safeValidate(GradeArraySchema, json, `/grades?evaluation_id=${evaluationId}`)
  },

  createEvaluation: async (data: EvaluationCreate): Promise<Evaluation> => {
    const json = await apiFetch<unknown>(`/evaluations`, {
      method: "POST",
      body: JSON.stringify(data),
    })
    return safeValidate(EvaluationSchema, json, "POST /evaluations")
  },

  updateGrades: async (evaluationId: number, data: GradeBatchUpdate): Promise<Grade[]> => {
    const json = await apiFetch<unknown>(`/grades/${evaluationId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
    return safeValidate(GradeArraySchema, json, `PATCH /grades/${evaluationId}`)
  },
}
