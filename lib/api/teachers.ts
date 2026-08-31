import { z } from "zod"
import { TeacherSchema } from "@/lib/contracts/teacher"
import type { Teacher, TeacherCreate, TeacherUpdate } from "@/lib/contracts/teacher"
import { createCrudApi } from "./createCrudApi"
import { apiFetch, apiFetchMultipart } from "./client"

const PhotoUploadResponseSchema = z.object({ photo_url: z.string() })

export const teachersApi = {
  ...createCrudApi<Teacher, TeacherCreate, TeacherUpdate>(
    "/admin/teachers",
    TeacherSchema,
  ),

  getFull: async (id: number): Promise<Record<string, unknown>> => {
    return apiFetch<Record<string, unknown>>(`/admin/teachers/${id}/full`)
  },

  uploadPhoto: async (teacherId: number, file: File): Promise<{ photo_url: string }> => {
    const formData = new FormData()
    formData.append("file", file)
    return apiFetchMultipart(`/admin/teachers/${teacherId}/photo`, formData, {
      schema: PhotoUploadResponseSchema,
      context: "POST /admin/teachers/:id/photo",
      fallback: "Échec de l'envoi de la photo",
    })
  },

  deletePhoto: async (teacherId: number): Promise<void> => {
    await apiFetch<void>(`/admin/teachers/${teacherId}/photo`, { method: "DELETE" })
  },
}
