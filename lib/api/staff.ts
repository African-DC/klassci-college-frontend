import { z } from "zod"
import { StaffSchema, StaffFullSchema } from "@/lib/contracts/staff"
import type { Staff, StaffCreate, StaffUpdate, StaffFull } from "@/lib/contracts/staff"
import { createCrudApi } from "./createCrudApi"
import { apiFetch, apiFetchMultipart, safeValidate } from "./client"

const PhotoUploadResponseSchema = z.object({ photo_url: z.string() })

export const staffApi = {
  ...createCrudApi<Staff, StaffCreate, StaffUpdate>(
    "/admin/staff",
    StaffSchema,
  ),

  getFull: async (id: number): Promise<StaffFull> => {
    const json = await apiFetch<unknown>(`/admin/staff/${id}/full`)
    return safeValidate(StaffFullSchema, json, `GET /admin/staff/${id}/full`)
  },

  uploadPhoto: async (staffId: number, file: File): Promise<{ photo_url: string }> => {
    const formData = new FormData()
    formData.append("file", file)
    return apiFetchMultipart(`/admin/staff/${staffId}/photo`, formData, {
      schema: PhotoUploadResponseSchema,
      context: "POST /admin/staff/:id/photo",
      fallback: "Échec de l'envoi de la photo",
    })
  },

  deletePhoto: async (staffId: number): Promise<void> => {
    await apiFetch<void>(`/admin/staff/${staffId}/photo`, { method: "DELETE" })
  },
}
