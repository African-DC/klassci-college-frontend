import { EnrollmentSchema } from "@/lib/contracts/enrollment"
import type { Enrollment, EnrollmentCreate, EnrollmentUpdate, NewEnrollment, ReEnrollment, FeeVariantOption } from "@/lib/contracts/enrollment"
import { createCrudApi } from "./createCrudApi"
import { apiFetch } from "./client"

export const enrollmentsApi = {
  ...createCrudApi<Enrollment, EnrollmentCreate, EnrollmentUpdate>(
    "/enrollments",
    EnrollmentSchema,
  ),

  createWithStudent: async (data: NewEnrollment) => {
    const { type, ...payload } = data
    return apiFetch<Enrollment>("/enrollments/with-student", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  reEnroll: async (data: ReEnrollment) => {
    const { type, ...payload } = data
    return apiFetch<Enrollment>("/enrollments/re-enroll", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  getFeeVariants: async (classId: number) => {
    return apiFetch<FeeVariantOption[]>(`/enrollments/fee-variants?class_id=${classId}`)
  },

  validate: async (id: number) => {
    return apiFetch<Enrollment>(`/enrollments/${id}/validate`, { method: "POST" })
  },
}
