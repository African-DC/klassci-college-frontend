import { apiFetch } from "@/lib/api/client"

export interface Evaluation {
  id: number
  title: string
  type: "devoir" | "interro" | "examen" | "composition"
  date: string
  coefficient: number
  subject_id: number
  subject_name: string
  class_id: number
  class_name: string
  teacher_id: number
  teacher_name: string
  total_students: number
  graded_students: number
  created_at: string
}

export interface Grade {
  id: number
  evaluation_id: number
  student_id: number
  student_name: string
  value: number | null
}

export interface EvaluationCreateBody {
  title: string
  type: string
  date: string
  coefficient: number
  subject_id: number
  class_id: number
}

export interface GradeBatchUpdateBody {
  grades: { student_id: number; value: number | null }[]
}

export const gradesApi = {
  listEvaluations: async (classId: number): Promise<Evaluation[]> => {
    const json = await apiFetch<{ data?: Evaluation[] } | Evaluation[]>(
      `/evaluations?class_id=${classId}`,
    )
    return Array.isArray(json) ? json : json.data ?? []
  },

  getGrades: async (evaluationId: number): Promise<Grade[]> => {
    const json = await apiFetch<{ data?: Grade[] } | Grade[]>(
      `/evaluations/${evaluationId}/grades`,
    )
    return Array.isArray(json) ? json : json.data ?? []
  },

  createEvaluation: async (data: EvaluationCreateBody): Promise<Evaluation> => {
    const json = await apiFetch<{ data?: Evaluation } | Evaluation>(
      `/evaluations`,
      { method: "POST", body: JSON.stringify(data) },
    )
    return (json as { data?: Evaluation }).data ?? (json as Evaluation)
  },

  updateGrades: async (evaluationId: number, data: GradeBatchUpdateBody): Promise<Grade[]> => {
    const json = await apiFetch<{ data?: Grade[] } | Grade[]>(
      `/evaluations/${evaluationId}/grades`,
      { method: "PUT", body: JSON.stringify(data) },
    )
    return Array.isArray(json) ? json : json.data ?? []
  },
}
