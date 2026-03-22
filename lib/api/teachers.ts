import { z } from "zod"
import { apiFetch, safeValidate } from "./client"
import {
  TeacherSchema,
  type Teacher,
  type TeacherCreate,
  type TeacherUpdate,
  type TeacherListParams,
} from "@/lib/contracts/teacher"
import { PaginatedResponseSchema, type PaginatedResponse } from "@/lib/contracts"

const PaginatedTeachers = PaginatedResponseSchema(TeacherSchema)
const TeacherArraySchema = z.array(TeacherSchema)

export type { Teacher, TeacherCreate, TeacherUpdate, TeacherListParams }
export type { PaginatedResponse }

export const teachersApi = {
  list: async (params: TeacherListParams = {}): Promise<PaginatedResponse<Teacher>> => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        query.set(key, String(value))
      }
    })
    const json = await apiFetch<PaginatedResponse<Teacher> | Teacher[]>(
      `/teachers?${query.toString()}`,
    )
    if (Array.isArray(json)) {
      const data = safeValidate(TeacherArraySchema, json, "/teachers")
      return { data, total: data.length, page: 1, per_page: data.length, total_pages: 1 }
    }
    return safeValidate(PaginatedTeachers, json, "/teachers")
  },

  getById: async (id: number): Promise<Teacher> => {
    const res = await apiFetch<{ data?: Teacher }>(`/teachers/${id}`)
    const item = (res as { data?: Teacher }).data ?? (res as unknown as Teacher)
    return safeValidate(TeacherSchema, item, `/teachers/${id}`)
  },

  create: async (data: TeacherCreate): Promise<Teacher> => {
    const res = await apiFetch<{ data?: Teacher }>("/teachers", {
      method: "POST",
      body: JSON.stringify(data),
    })
    const item = (res as { data?: Teacher }).data ?? (res as unknown as Teacher)
    return safeValidate(TeacherSchema, item, "POST /teachers")
  },

  update: async (id: number, data: TeacherUpdate): Promise<Teacher> => {
    const res = await apiFetch<{ data?: Teacher }>(`/teachers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
    const item = (res as { data?: Teacher }).data ?? (res as unknown as Teacher)
    return safeValidate(TeacherSchema, item, `PATCH /teachers/${id}`)
  },

  remove: async (id: number): Promise<void> => {
    await apiFetch(`/teachers/${id}`, { method: "DELETE" })
  },
}
