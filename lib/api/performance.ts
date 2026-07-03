import { apiFetch, safeValidate } from "./client"
import {
  StaffActivityListSchema,
  TeacherPerformanceListSchema,
  TeacherSelfPerformanceSchema,
  type StaffActivityList,
  type TeacherPerformanceList,
  type TeacherSelfPerformance,
} from "@/lib/contracts/performance"

function unwrap(json: unknown): unknown {
  if (json !== null && typeof json === "object") {
    const obj = json as Record<string, unknown>
    if (obj.data !== undefined) return obj.data
  }
  return json
}

export const performanceApi = {
  // Score de performance de tous les enseignants (vue direction)
  getTeachers: async (): Promise<TeacherPerformanceList> => {
    const json = await apiFetch<unknown>("/admin/performance/teachers")
    return safeValidate(TeacherPerformanceListSchema, unwrap(json), "GET /admin/performance/teachers")
  },

  // Tableau d'activité du personnel (vue direction)
  getStaff: async (): Promise<StaffActivityList> => {
    const json = await apiFetch<unknown>("/admin/performance/staff")
    return safeValidate(StaffActivityListSchema, unwrap(json), "GET /admin/performance/staff")
  },

  // Ma performance — enseignant connecté
  getMyPerformance: async (): Promise<TeacherSelfPerformance> => {
    const json = await apiFetch<unknown>("/teacher/performance/me")
    return safeValidate(TeacherSelfPerformanceSchema, unwrap(json), "GET /teacher/performance/me")
  },
}
