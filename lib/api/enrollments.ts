import { apiFetch, safeValidate } from "./client"
import {
  EnrollmentSchema,
  type Enrollment,
  type EnrollmentCreate,
  type EnrollmentUpdate,
  type EnrollmentListParams,
} from "@/lib/contracts/enrollment"
import { PaginatedResponseSchema, type PaginatedResponse } from "@/lib/contracts"

const PaginatedEnrollments = PaginatedResponseSchema(EnrollmentSchema)

export type { Enrollment, EnrollmentCreate, EnrollmentUpdate, EnrollmentListParams }
export type { PaginatedResponse }

export const enrollmentsApi = {
  list: async (params: EnrollmentListParams = {}): Promise<PaginatedResponse<Enrollment>> => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        query.set(key, String(value))
      }
    })
    return apiFetch(`/enrollments?${query.toString()}`, { schema: PaginatedEnrollments })
  },

  getById: async (id: number): Promise<Enrollment> => {
    const res = await apiFetch<{ data?: Enrollment }>(`/enrollments/${id}`)
    const enrollment = (res as { data?: Enrollment }).data ?? (res as unknown as Enrollment)
    return safeValidate(EnrollmentSchema, enrollment, `/enrollments/${id}`)
  },

  create: async (data: EnrollmentCreate): Promise<Enrollment> => {
    const res = await apiFetch<{ data?: Enrollment }>("/enrollments", {
      method: "POST",
      body: JSON.stringify(data),
    })
    const enrollment = (res as { data?: Enrollment }).data ?? (res as unknown as Enrollment)
    return safeValidate(EnrollmentSchema, enrollment, "POST /enrollments")
  },

  update: async (id: number, data: EnrollmentUpdate): Promise<Enrollment> => {
    const res = await apiFetch<{ data?: Enrollment }>(`/enrollments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
    const enrollment = (res as { data?: Enrollment }).data ?? (res as unknown as Enrollment)
    return safeValidate(EnrollmentSchema, enrollment, `PATCH /enrollments/${id}`)
  },

  remove: async (id: number): Promise<void> => {
    await apiFetch(`/enrollments/${id}`, { method: "DELETE" })
  },
}
