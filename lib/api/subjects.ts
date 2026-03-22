import { z } from "zod"
import { apiFetch, safeValidate } from "./client"
import {
  SubjectSchema,
  type Subject,
  type SubjectCreate,
  type SubjectUpdate,
  type SubjectListParams,
} from "@/lib/contracts/subject"
import { PaginatedResponseSchema, type PaginatedResponse } from "@/lib/contracts"

const PaginatedSubjects = PaginatedResponseSchema(SubjectSchema)
const SubjectArraySchema = z.array(SubjectSchema)

export type { Subject, SubjectCreate, SubjectUpdate, SubjectListParams }
export type { PaginatedResponse }

export const subjectsApi = {
  list: async (params: SubjectListParams = {}): Promise<PaginatedResponse<Subject>> => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        query.set(key, String(value))
      }
    })
    const json = await apiFetch<PaginatedResponse<Subject> | Subject[]>(
      `/subjects?${query.toString()}`,
    )
    if (Array.isArray(json)) {
      const data = safeValidate(SubjectArraySchema, json, "/subjects")
      return { data, total: data.length, page: 1, per_page: data.length, total_pages: 1 }
    }
    return safeValidate(PaginatedSubjects, json, "/subjects")
  },

  getById: async (id: number): Promise<Subject> => {
    const res = await apiFetch<{ data?: Subject }>(`/subjects/${id}`)
    const subject = (res as { data?: Subject }).data ?? (res as unknown as Subject)
    return safeValidate(SubjectSchema, subject, `/subjects/${id}`)
  },

  create: async (data: SubjectCreate): Promise<Subject> => {
    const res = await apiFetch<{ data?: Subject }>("/subjects", {
      method: "POST",
      body: JSON.stringify(data),
    })
    const subject = (res as { data?: Subject }).data ?? (res as unknown as Subject)
    return safeValidate(SubjectSchema, subject, "POST /subjects")
  },

  update: async (id: number, data: SubjectUpdate): Promise<Subject> => {
    const res = await apiFetch<{ data?: Subject }>(`/subjects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
    const subject = (res as { data?: Subject }).data ?? (res as unknown as Subject)
    return safeValidate(SubjectSchema, subject, `PATCH /subjects/${id}`)
  },

  remove: async (id: number): Promise<void> => {
    await apiFetch(`/subjects/${id}`, { method: "DELETE" })
  },
}
