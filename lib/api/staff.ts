import { getSession } from "next-auth/react"
import { StaffSchema } from "@/lib/contracts/staff"
import type { Staff, StaffCreate, StaffUpdate } from "@/lib/contracts/staff"
import { createCrudApi } from "./createCrudApi"
import { apiFetch } from "./client"

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL
  if (!url) throw new Error("NEXT_PUBLIC_API_URL is not defined")
  return url
}

export const staffApi = {
  ...createCrudApi<Staff, StaffCreate, StaffUpdate>(
    "/admin/staff",
    StaffSchema,
  ),

  getFull: async (id: number): Promise<Record<string, unknown>> => {
    return apiFetch<Record<string, unknown>>(`/admin/staff/${id}/full`)
  },

  uploadPhoto: async (staffId: number, file: File): Promise<{ photo_url: string }> => {
    const session = await getSession()
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch(`${getBaseUrl()}/admin/staff/${staffId}/photo`, {
      method: "POST",
      headers: {
        ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      },
      body: formData,
    })
    if (!res.ok) throw new Error("Upload failed")
    return res.json()
  },

  deletePhoto: async (staffId: number): Promise<void> => {
    const session = await getSession()
    const res = await fetch(`${getBaseUrl()}/admin/staff/${staffId}/photo`, {
      method: "DELETE",
      headers: {
        ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      },
    })
    if (!res.ok) throw new Error("Erreur lors de la suppression de la photo")
  },
}
