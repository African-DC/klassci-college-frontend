import { apiFetch } from "./client"
import {
  SchoolSettingsSchema,
  type SchoolSettings,
  type SchoolInfoUpdate,
  type TrimesterUpdate,
  type HolidaysUpdate,
  type NotificationUpdate,
} from "@/lib/contracts/settings"

function unwrap(json: unknown): unknown {
  if (json !== null && typeof json === "object" && "data" in json) {
    const data = (json as { data?: unknown }).data
    if (data !== undefined) return data
  }
  return json
}

function parseSettings(json: unknown, context: string): SchoolSettings {
  const parsed = SchoolSettingsSchema.safeParse(unwrap(json))
  if (!parsed.success) {
    console.error(`[API] Validation failed for ${context}:`, parsed.error.issues)
    throw new Error(`Réponse inattendue du serveur pour ${context}`)
  }
  return parsed.data
}

export const settingsApi = {
  get: async (): Promise<SchoolSettings> => {
    const json = await apiFetch<unknown>("/admin/settings")
    return parseSettings(json, "GET /admin/settings")
  },

  updateSchoolInfo: async (data: SchoolInfoUpdate): Promise<SchoolSettings> => {
    const json = await apiFetch<unknown>("/admin/settings/school-info", {
      method: "PUT",
      body: JSON.stringify(data),
    })
    return parseSettings(json, "PUT /admin/settings/school-info")
  },

  updateTrimesters: async (data: TrimesterUpdate): Promise<SchoolSettings> => {
    const json = await apiFetch<unknown>("/admin/settings/trimesters", {
      method: "PUT",
      body: JSON.stringify(data),
    })
    return parseSettings(json, "PUT /admin/settings/trimesters")
  },

  updateHolidays: async (data: HolidaysUpdate): Promise<SchoolSettings> => {
    const json = await apiFetch<unknown>("/admin/settings/holidays", {
      method: "PUT",
      body: JSON.stringify(data),
    })
    return parseSettings(json, "PUT /admin/settings/holidays")
  },

  updateNotifications: async (data: NotificationUpdate): Promise<SchoolSettings> => {
    const json = await apiFetch<unknown>("/admin/settings/notifications", {
      method: "PUT",
      body: JSON.stringify(data),
    })
    return parseSettings(json, "PUT /admin/settings/notifications")
  },
}
