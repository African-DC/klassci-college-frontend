import { apiFetch } from "./client"

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
    return apiFetch(`/enrollments?${query.toString()}`)
  },

  getById: async (id: number): Promise<Enrollment> => {
    const res = await apiFetch<{ data?: Enrollment }>(`/enrollments/${id}`)
    return (res as { data?: Enrollment }).data ?? (res as unknown as Enrollment)
  },

  create: async (data: EnrollmentCreateBody): Promise<Enrollment> => {
    const res = await apiFetch<{ data?: Enrollment }>("/enrollments", {
      method: "POST",
      body: JSON.stringify(data),
    })
    return (res as { data?: Enrollment }).data ?? (res as unknown as Enrollment)
  },

  update: async (id: number, data: EnrollmentUpdateBody): Promise<Enrollment> => {
    const res = await apiFetch<{ data?: Enrollment }>(`/enrollments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
    return (res as { data?: Enrollment }).data ?? (res as unknown as Enrollment)
  },

  remove: async (id: number): Promise<void> => {
    await apiFetch(`/enrollments/${id}`, { method: "DELETE" })
  },
}
