import { getSession } from "next-auth/react"
import { TeacherSchema } from "@/lib/contracts/teacher"
import type { Teacher, TeacherCreate, TeacherUpdate } from "@/lib/contracts/teacher"
import { createCrudApi } from "./createCrudApi"
import { apiFetch } from "./client"

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL
  if (!url) throw new Error("NEXT_PUBLIC_API_URL is not defined")
  return url
}

export const teachersApi = {
  ...createCrudApi<Teacher, TeacherCreate, TeacherUpdate>(
    "/admin/teachers",
    TeacherSchema,
  ),

  getFull: async (id: number): Promise<Record<string, unknown>> => {
    return apiFetch<Record<string, unknown>>(`/admin/teachers/${id}/full`)
  },

  uploadPhoto: async (teacherId: number, file: File): Promise<{ photo_url: string }> => {
    const session = await getSession()
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch(`${getBaseUrl()}/admin/teachers/${teacherId}/photo`, {
      method: "POST",
      headers: {
        ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      },
      body: formData,
    })
    if (!res.ok) throw new Error("Upload failed")
    return res.json()
  },

  deletePhoto: async (teacherId: number): Promise<void> => {
    const session = await getSession()
    const res = await fetch(`${getBaseUrl()}/admin/teachers/${teacherId}/photo`, {
      method: "DELETE",
      headers: {
        ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      },
    })
    if (!res.ok) throw new Error("Erreur lors de la suppression de la photo")
  },
}
