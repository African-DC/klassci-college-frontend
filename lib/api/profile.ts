import { getSession } from "next-auth/react"
import { z } from "zod"
import { MyProfileSchema, type MyProfile, type MyProfileUpdate } from "@/lib/contracts/profile"
import { apiFetch, handleExpiredSession, safeValidate } from "./client"

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL
  if (!url) throw new Error("NEXT_PUBLIC_API_URL is not defined")
  return url
}

const PhotoResponseSchema = z.object({ photo_url: z.string().nullable() })

export const profileApi = {
  me: async (): Promise<MyProfile> => {
    const json = await apiFetch<unknown>("/profile/me")
    return safeValidate(MyProfileSchema, json, "GET /profile/me")
  },

  update: async (data: MyProfileUpdate): Promise<MyProfile> => {
    const json = await apiFetch<unknown>("/profile/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    })
    return safeValidate(MyProfileSchema, json, "PATCH /profile/me")
  },

  // Upload multipart : ne passe pas par apiFetch (JSON), on réplique le contrat 401.
  uploadPhoto: async (file: File): Promise<{ photo_url: string | null }> => {
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
    const res = await fetch(`${getBaseUrl()}/profile/me/photo`, {
      method: "POST",
      headers,
      body: formData,
    })
    if (res.status === 401) {
      if (hadToken) void handleExpiredSession()
      throw new Error("Session expirée")
    }
    if (!res.ok) throw new Error("Échec de l'envoi de la photo")
    const data = await res.json()
    return safeValidate(PhotoResponseSchema, data, "POST /profile/me/photo")
  },

  deletePhoto: async (): Promise<void> => {
    await apiFetch<void>("/profile/me/photo", { method: "DELETE" })
  },
}
