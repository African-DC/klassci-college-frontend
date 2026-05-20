import { getSession } from "next-auth/react"
import { StudentFiltersSchema, StudentFullSchema, StudentSchema } from "@/lib/contracts/student"
import type { Student, StudentCreate, StudentFilters, StudentFull, StudentUpdate } from "@/lib/contracts/student"
import { createCrudApi } from "./createCrudApi"
import { apiFetch, handleExpiredSession, safeValidate } from "./client"
import { z } from "zod"

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL
  if (!url) throw new Error("NEXT_PUBLIC_API_URL is not defined")
  return url
}

const PhotoUploadResponseSchema = z.object({ photo_url: z.string() })

const StudentEnrollmentFeeSchema = z.object({
  id: z.number(),
  enrollment_id: z.number(),
  category_name: z.string(),
  amount: z.number(),
  paid: z.number(),
  remaining: z.number(),
  status: z.string(),
})
const StudentEnrollmentFeeListSchema = z.array(StudentEnrollmentFeeSchema)

function unwrapItems(json: unknown): unknown {
  if (Array.isArray(json)) return json
  if (json !== null && typeof json === "object") {
    const obj = json as Record<string, unknown>
    if (obj.items !== undefined) return obj.items
    if (obj.data !== undefined) return obj.data
  }
  return json
}

export const studentsApi = {
  ...createCrudApi<Student, StudentCreate, StudentUpdate>(
    "/admin/students",
    StudentSchema,
  ),

  uploadPhoto: async (studentId: number, file: File): Promise<{ photo_url: string }> => {
    // FormData multipart upload — can't go through apiFetch (which JSON-encodes).
    // We replicate the 401 → handleExpiredSession contract manually.
    const session = await getSession()
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch(`${getBaseUrl()}/admin/students/${studentId}/photo`, {
      method: "POST",
      headers: {
        ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      },
      body: formData,
    })
    if (res.status === 401) {
      if (session?.accessToken) await handleExpiredSession()
      throw new Error("Session expirée")
    }
    if (!res.ok) throw new Error("Upload failed")
    const data = await res.json()
    return safeValidate(PhotoUploadResponseSchema, data, "POST /admin/students/:id/photo")
  },

  deletePhoto: async (studentId: number): Promise<void> => {
    await apiFetch<void>(`/admin/students/${studentId}/photo`, { method: "DELETE" })
  },

  getFilters: async (): Promise<StudentFilters> => {
    const data = await apiFetch<unknown>("/admin/students/filters")
    return safeValidate(StudentFiltersSchema, data, "GET /admin/students/filters")
  },

  getEnrollmentFees: async (studentId: number): Promise<StudentEnrollmentFee[]> => {
    const data = await apiFetch<unknown>(`/admin/students/${studentId}/fees`)
    return safeValidate(StudentEnrollmentFeeListSchema, unwrapItems(data), `GET /admin/students/${studentId}/fees`)
  },

  getFull: async (studentId: number): Promise<StudentFull> => {
    const data = await apiFetch<unknown>(`/admin/students/${studentId}/full`)
    return safeValidate(StudentFullSchema, data, `GET /admin/students/${studentId}/full`)
  },
}

export type StudentEnrollmentFee = z.infer<typeof StudentEnrollmentFeeSchema>
