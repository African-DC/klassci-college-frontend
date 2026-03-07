import { apiFetch } from "@/lib/api/client"

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
    return apiFetch<PaginatedResponse<Enrollment>>(`/enrollments?${query.toString()}`)
  },

  getById: async (id: number): Promise<Enrollment> => {
    const json = await apiFetch<{ data?: Enrollment } | Enrollment>(`/enrollments/${id}`)
    return (json as { data?: Enrollment }).data ?? (json as Enrollment)
  },

  create: async (data: EnrollmentCreateBody): Promise<Enrollment> => {
    const json = await apiFetch<{ data?: Enrollment } | Enrollment>(`/enrollments`, {
      method: "POST",
      body: JSON.stringify(data),
    })
    return (json as { data?: Enrollment }).data ?? (json as Enrollment)
  },

  update: async (id: number, data: EnrollmentUpdateBody): Promise<Enrollment> => {
    const json = await apiFetch<{ data?: Enrollment } | Enrollment>(`/enrollments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
    return (json as { data?: Enrollment }).data ?? (json as Enrollment)
  },

  remove: async (id: number): Promise<void> => {
    await apiFetch<void>(`/enrollments/${id}`, { method: "DELETE" })
  },
}
