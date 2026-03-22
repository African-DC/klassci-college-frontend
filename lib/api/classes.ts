import { z } from "zod"
import { apiFetch, safeValidate } from "./client"
import {
  ClassSchema,
  type Class,
  type ClassCreate,
  type ClassUpdate,
  type ClassListParams,
} from "@/lib/contracts/class"
import { PaginatedResponseSchema, type PaginatedResponse } from "@/lib/contracts"

const PaginatedClasses = PaginatedResponseSchema(ClassSchema)
const ClassArraySchema = z.array(ClassSchema)

export type { Class, ClassCreate, ClassUpdate, ClassListParams }
export type { PaginatedResponse }

export const classesApi = {
  list: async (params: ClassListParams = {}): Promise<PaginatedResponse<Class>> => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        query.set(key, String(value))
      }
    })
    const json = await apiFetch<PaginatedResponse<Class> | Class[]>(
      `/classes?${query.toString()}`,
    )
    if (Array.isArray(json)) {
      const data = safeValidate(ClassArraySchema, json, "/classes")
      return { data, total: data.length, page: 1, per_page: data.length, total_pages: 1 }
    }
    return safeValidate(PaginatedClasses, json, "/classes")
  },

  getById: async (id: number): Promise<Class> => {
    const res = await apiFetch<{ data?: Class }>(`/classes/${id}`)
    const item = (res as { data?: Class }).data ?? (res as unknown as Class)
    return safeValidate(ClassSchema, item, `/classes/${id}`)
  },

  create: async (data: ClassCreate): Promise<Class> => {
    const res = await apiFetch<{ data?: Class }>("/classes", {
      method: "POST",
      body: JSON.stringify(data),
    })
    const item = (res as { data?: Class }).data ?? (res as unknown as Class)
    return safeValidate(ClassSchema, item, "POST /classes")
  },

  update: async (id: number, data: ClassUpdate): Promise<Class> => {
    const res = await apiFetch<{ data?: Class }>(`/classes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
    const item = (res as { data?: Class }).data ?? (res as unknown as Class)
    return safeValidate(ClassSchema, item, `PATCH /classes/${id}`)
  },

  remove: async (id: number): Promise<void> => {
    await apiFetch(`/classes/${id}`, { method: "DELETE" })
  },
}
