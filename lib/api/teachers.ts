import { TeacherSchema } from "@/lib/contracts/teacher"
import type { Teacher, TeacherCreate, TeacherUpdate } from "@/lib/contracts/teacher"
import { createCrudApi } from "./createCrudApi"
import { apiFetch } from "./client"

export const teachersApi = {
  ...createCrudApi<Teacher, TeacherCreate, TeacherUpdate>(
    "/admin/teachers",
    TeacherSchema,
  ),

  getFull: async (id: number): Promise<Record<string, unknown>> => {
    return apiFetch<Record<string, unknown>>(`/admin/teachers/${id}/full`)
  },
}
