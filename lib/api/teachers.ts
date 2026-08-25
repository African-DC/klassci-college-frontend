import { getSession } from "next-auth/react"
import { z } from "zod"
import { TeacherSchema } from "@/lib/contracts/teacher"
import type { Teacher, TeacherCreate, TeacherUpdate } from "@/lib/contracts/teacher"
import { createCrudApi } from "./createCrudApi"
import { apiFetch, handleExpiredSession, safeValidate } from "./client"

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL
  if (!url) throw new Error("NEXT_PUBLIC_API_URL is not defined")
  return url
}

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
    // FormData multipart upload — can't go through apiFetch (JSON-encoded).
    // 401 → handleExpiredSession contract replicated manually.
    const session = await getSession()
    if (session?.error === "RefreshTokenError") {
      void handleExpiredSession()
      throw new Error("Session expirée")
    }
    const formData = new FormData()
    formData.append("file", file)
    const headers: Record<string, string> = session?.accessToken
      ? { Authorization: `Bearer ${session.accessToken}` }
      : {}
    const hadToken = "Authorization" in headers
    const res = await fetch(`${getBaseUrl()}/admin/teachers/${teacherId}/photo`, {
      method: "POST",
      headers,
      body: formData,
    })
    if (res.status === 401) {
      if (hadToken) void handleExpiredSession()
      throw new Error("Session expirée")
    }
    if (!res.ok) throw new Error("Upload failed")
    const data = await res.json()
    return safeValidate(PhotoUploadResponseSchema, data, "POST /admin/teachers/:id/photo")
  },

  deletePhoto: async (teacherId: number): Promise<void> => {
    await apiFetch<void>(`/admin/teachers/${teacherId}/photo`, { method: "DELETE" })
  },
}
