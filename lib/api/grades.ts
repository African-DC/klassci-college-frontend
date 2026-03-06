const BASE_URL = process.env.NEXT_PUBLIC_API_URL

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
    const res = await fetch(`${BASE_URL}/evaluations?class_id=${classId}`, {
      headers: { "Content-Type": "application/json" },
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Erreur serveur" }))
      throw new Error(error.detail || "Erreur lors du chargement")
    }
    const json = await res.json()
    return json.data ?? json
  },

  getGrades: async (evaluationId: number): Promise<Grade[]> => {
    const res = await fetch(`${BASE_URL}/evaluations/${evaluationId}/grades`, {
      headers: { "Content-Type": "application/json" },
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Erreur serveur" }))
      throw new Error(error.detail || "Erreur lors du chargement des notes")
    }
    const json = await res.json()
    return json.data ?? json
  },

  createEvaluation: async (data: EvaluationCreateBody): Promise<Evaluation> => {
    const res = await fetch(`${BASE_URL}/evaluations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Erreur serveur" }))
      throw new Error(error.detail || "Erreur lors de la creation")
    }
    const json = await res.json()
    return json.data ?? json
  },

  updateGrades: async (evaluationId: number, data: GradeBatchUpdateBody): Promise<Grade[]> => {
    const res = await fetch(`${BASE_URL}/evaluations/${evaluationId}/grades`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Erreur serveur" }))
      throw new Error(error.detail || "Erreur lors de la sauvegarde")
    }
    const json = await res.json()
    return json.data ?? json
  },
}
