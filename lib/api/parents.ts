import { ParentSchema } from "@/lib/contracts/parent"
import type { Parent, ParentCreate, ParentUpdate } from "@/lib/contracts/parent"
import { createCrudApi } from "./createCrudApi"
import { apiFetch } from "./client"

export const parentsApi = {
  ...createCrudApi<Parent, ParentCreate, ParentUpdate>("/admin/parents", ParentSchema),

  getFull: async (id: number): Promise<Record<string, unknown>> => {
    return apiFetch<Record<string, unknown>>(`/admin/parents/${id}/full`)
  },

  getStudentParents: async (studentId: number): Promise<Parent[]> => {
    const res = await apiFetch<Parent[] | { items?: Parent[]; data?: Parent[] }>(`/admin/students/${studentId}/parents`)
    if (Array.isArray(res)) return res
    return res.items ?? res.data ?? []
  },

  linkToStudent: async (parentId: number, studentId: number, relationshipType: string = "guardian"): Promise<void> => {
    await apiFetch(`/admin/parents/${parentId}/link/${studentId}`, {
      method: "POST",
      body: JSON.stringify({ relationship_type: relationshipType }),
    })
  },

  unlinkFromStudent: async (parentId: number, studentId: number): Promise<void> => {
    await apiFetch(`/admin/parents/${parentId}/link/${studentId}`, { method: "DELETE" })
  },
}
