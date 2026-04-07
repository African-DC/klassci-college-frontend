import { apiFetch } from "./client"
import type { SchoolSettings, SchoolInfoUpdate, TrimesterUpdate, NotificationUpdate } from "@/lib/contracts/settings"

export const settingsApi = {
  // Récupérer les paramètres de l'école
  get: async (): Promise<SchoolSettings> => {
    const json = await apiFetch<{ data?: SchoolSettings } | SchoolSettings>("/settings")
    return (json as { data?: SchoolSettings }).data ?? (json as SchoolSettings)
  },

  // Mettre à jour les informations de l'école
  updateSchoolInfo: async (data: SchoolInfoUpdate): Promise<SchoolSettings> => {
    const json = await apiFetch<{ data?: SchoolSettings } | SchoolSettings>("/settings/school-info", {
      method: "PUT",
      body: JSON.stringify(data),
    })
    return (json as { data?: SchoolSettings }).data ?? (json as SchoolSettings)
  },

  // Mettre à jour la configuration des trimestres
  updateTrimesters: async (data: TrimesterUpdate): Promise<SchoolSettings> => {
    const json = await apiFetch<{ data?: SchoolSettings } | SchoolSettings>("/settings/trimesters", {
      method: "PUT",
      body: JSON.stringify(data),
    })
    return (json as { data?: SchoolSettings }).data ?? (json as SchoolSettings)
  },

  // Mettre à jour les paramètres de notification
  updateNotifications: async (data: NotificationUpdate): Promise<SchoolSettings> => {
    const json = await apiFetch<{ data?: SchoolSettings } | SchoolSettings>("/settings/notifications", {
      method: "PUT",
      body: JSON.stringify(data),
    })
    return (json as { data?: SchoolSettings }).data ?? (json as SchoolSettings)
  },
}
