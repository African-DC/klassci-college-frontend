import { z } from "zod"
import {
  MyProfileSchema,
  NotificationPrefsSchema,
  type MyProfile,
  type MyProfileUpdate,
  type NotificationPrefs,
  type NotificationPrefsUpdate,
} from "@/lib/contracts/profile"
import { apiFetch, apiFetchMultipart, safeValidate } from "./client"

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

  uploadPhoto: async (file: File): Promise<{ photo_url: string | null }> => {
    const formData = new FormData()
    formData.append("file", file)
    return apiFetchMultipart("/profile/me/photo", formData, {
      schema: PhotoResponseSchema,
      context: "POST /profile/me/photo",
      fallback: "Échec de l'envoi de la photo",
    })
  },

  deletePhoto: async (): Promise<void> => {
    await apiFetch<void>("/profile/me/photo", { method: "DELETE" })
  },

  notifications: async (): Promise<NotificationPrefs> => {
    const json = await apiFetch<unknown>("/profile/me/notifications")
    return safeValidate(NotificationPrefsSchema, json, "GET /profile/me/notifications")
  },

  updateNotifications: async (data: NotificationPrefsUpdate): Promise<NotificationPrefs> => {
    const json = await apiFetch<unknown>("/profile/me/notifications", {
      method: "PUT",
      body: JSON.stringify(data),
    })
    return safeValidate(NotificationPrefsSchema, json, "PUT /profile/me/notifications")
  },
}
