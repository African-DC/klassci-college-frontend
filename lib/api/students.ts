import { StudentFiltersSchema, StudentFullSchema, StudentSchema } from "@/lib/contracts/student"
import type { Student, StudentCreate, StudentFilters, StudentFull, StudentUpdate } from "@/lib/contracts/student"
import { createCrudApi } from "./createCrudApi"
import { apiFetch, apiFetchMultipart, safeValidate } from "./client"
import { z } from "zod"
import { FeeEntitlementSchema } from "@/lib/contracts/fee"

const PhotoUploadResponseSchema = z.object({ photo_url: z.string() })

const StudentEnrollmentFeeSchema = z.object({
  id: z.number(),
  enrollment_id: z.number(),
  category_name: z.string(),
  entitlements: z.array(FeeEntitlementSchema).optional(),
  amount: z.number(),
  paid: z.number(),
  remaining: z.number(),
  status: z.string(),
  accepts_in_kind: z.boolean().optional(),
  // Le nom de l'option prime sur celui de la catégorie à l'affichage : une
  // famille reconnaît « Cantine midi », pas « Frais optionnels ».
  is_optional: z.boolean().optional(),
  option_name: z.string().nullish(),
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
    const formData = new FormData()
    formData.append("file", file)
    return apiFetchMultipart(`/admin/students/${studentId}/photo`, formData, {
      schema: PhotoUploadResponseSchema,
      context: "POST /admin/students/:id/photo",
      fallback: "Échec de l'envoi de la photo",
    })
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
