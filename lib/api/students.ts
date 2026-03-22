import { z } from "zod"
import { apiFetch, safeValidate } from "./client"
import {
  StudentSchema,
  type Student,
  type StudentCreate,
  type StudentUpdate,
  type StudentListParams,
} from "@/lib/contracts/student"
import { PaginatedResponseSchema, type PaginatedResponse } from "@/lib/contracts"

const PaginatedStudents = PaginatedResponseSchema(StudentSchema)
const StudentArraySchema = z.array(StudentSchema)

export type { Student, StudentCreate, StudentUpdate, StudentListParams }
export type { PaginatedResponse }

export const studentsApi = {
  list: async (params: StudentListParams = {}): Promise<PaginatedResponse<Student>> => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        query.set(key, String(value))
      }
    })
    const json = await apiFetch<PaginatedResponse<Student> | Student[]>(
      `/students?${query.toString()}`,
    )
    if (Array.isArray(json)) {
      const data = safeValidate(StudentArraySchema, json, "/students")
      return { data, total: data.length, page: 1, per_page: data.length, total_pages: 1 }
    }
    return safeValidate(PaginatedStudents, json, "/students")
  },

  getById: async (id: number): Promise<Student> => {
    const res = await apiFetch<{ data?: Student }>(`/students/${id}`)
    const item = (res as { data?: Student }).data ?? (res as unknown as Student)
    return safeValidate(StudentSchema, item, `/students/${id}`)
  },

  create: async (data: StudentCreate): Promise<Student> => {
    const res = await apiFetch<{ data?: Student }>("/students", {
      method: "POST",
      body: JSON.stringify(data),
    })
    const item = (res as { data?: Student }).data ?? (res as unknown as Student)
    return safeValidate(StudentSchema, item, "POST /students")
  },

  update: async (id: number, data: StudentUpdate): Promise<Student> => {
    const res = await apiFetch<{ data?: Student }>(`/students/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
    const item = (res as { data?: Student }).data ?? (res as unknown as Student)
    return safeValidate(StudentSchema, item, `PATCH /students/${id}`)
  },

  remove: async (id: number): Promise<void> => {
    await apiFetch(`/students/${id}`, { method: "DELETE" })
  },
}
