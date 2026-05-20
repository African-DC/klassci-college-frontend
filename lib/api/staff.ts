import { getSession } from "next-auth/react"
import { z } from "zod"
import { StaffSchema } from "@/lib/contracts/staff"
import type { Staff, StaffCreate, StaffUpdate } from "@/lib/contracts/staff"
import { createCrudApi } from "./createCrudApi"
import { apiFetch, handleExpiredSession, safeValidate } from "./client"

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL
  if (!url) throw new Error("NEXT_PUBLIC_API_URL is not defined")
  return url
}

const PhotoUploadResponseSchema = z.object({ photo_url: z.string() })

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
    const res = await fetch(`${getBaseUrl()}/admin/staff/${staffId}/photo`, {
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
    return safeValidate(PhotoUploadResponseSchema, data, "POST /admin/staff/:id/photo")
  },

  deletePhoto: async (staffId: number): Promise<void> => {
    await apiFetch<void>(`/admin/staff/${staffId}/photo`, { method: "DELETE" })
  },
}
