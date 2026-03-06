const BASE_URL = process.env.NEXT_PUBLIC_API_URL

export interface Enrollment {
  id: number
  student_id: number
  student_name: string
  class_id: number
  class_name: string
  academic_year_id: number
  academic_year_label: string
  assignment_status: "affecte" | "reaffecte" | "non_affecte"
  is_scholarship: boolean
  created_at: string
  updated_at: string
}

export interface EnrollmentListParams {
  page?: number
  per_page?: number
  class_id?: number
  status?: string
  academic_year_id?: number
  search?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface EnrollmentCreateBody {
  student_id: number
  class_id: number
  academic_year_id: number
  assignment_status: string
  is_scholarship: boolean
}

export interface EnrollmentUpdateBody {
  class_id?: number
  assignment_status?: string
  is_scholarship?: boolean
}

export const enrollmentsApi = {
  list: async (params: EnrollmentListParams = {}): Promise<PaginatedResponse<Enrollment>> => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        query.set(key, String(value))
      }
    })
    const res = await fetch(`${BASE_URL}/enrollments?${query.toString()}`, {
      headers: { "Content-Type": "application/json" },
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Erreur serveur" }))
      throw new Error(error.detail || "Erreur lors du chargement des inscriptions")
    }
    return res.json()
  },

  getById: async (id: number): Promise<Enrollment> => {
    const res = await fetch(`${BASE_URL}/enrollments/${id}`, {
      headers: { "Content-Type": "application/json" },
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Erreur serveur" }))
      throw new Error(error.detail || "Inscription introuvable")
    }
    return res.json().then((r) => r.data ?? r)
  },

  create: async (data: EnrollmentCreateBody): Promise<Enrollment> => {
    const res = await fetch(`${BASE_URL}/enrollments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Erreur serveur" }))
      throw new Error(error.detail || "Erreur lors de la creation")
    }
    return res.json().then((r) => r.data ?? r)
  },

  update: async (id: number, data: EnrollmentUpdateBody): Promise<Enrollment> => {
    const res = await fetch(`${BASE_URL}/enrollments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Erreur serveur" }))
      throw new Error(error.detail || "Erreur lors de la mise a jour")
    }
    return res.json().then((r) => r.data ?? r)
  },

  remove: async (id: number): Promise<void> => {
    const res = await fetch(`${BASE_URL}/enrollments/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Erreur serveur" }))
      throw new Error(error.detail || "Erreur lors de la suppression")
    }
  },
}
