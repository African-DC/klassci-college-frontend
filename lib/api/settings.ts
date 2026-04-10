import { apiFetch } from "./client"
import type { SchoolSettings, SchoolInfoUpdate, TrimesterUpdate, NotificationUpdate } from "@/lib/contracts/settings"

const DEFAULT_SETTINGS: SchoolSettings = {
  school_name: "",
  address: null,
  phone: null,
  email: null,
  logo_url: null,
  ministry_code: null,
  enrollment_number_pattern: null,
  enrollment_number_counter: 0,
  active_academic_year: null,
  trimesters: [],
  notify_by_email: false,
  notify_by_sms: false,
  notify_grades: false,
  notify_absences: false,
  notify_payments: false,
}

export const settingsApi = {
  // Récupérer les paramètres de l'école
  get: async (): Promise<SchoolSettings> => {
    const json = await apiFetch<{ data?: SchoolSettings } | SchoolSettings>("/admin/settings")
    return (json as { data?: SchoolSettings }).data ?? (json as SchoolSettings)
  },

  // Mettre à jour les informations de l'école
  updateSchoolInfo: async (data: SchoolInfoUpdate): Promise<SchoolSettings> => {
    const json = await apiFetch<{ data?: SchoolSettings } | SchoolSettings>("/admin/settings/school-info", {
      method: "PUT",
      body: JSON.stringify(data),
    })
    return (json as { data?: SchoolSettings }).data ?? (json as SchoolSettings)
  },

  // Mettre à jour la configuration des trimestres
  updateTrimesters: async (data: TrimesterUpdate): Promise<SchoolSettings> => {
    const json = await apiFetch<{ data?: SchoolSettings } | SchoolSettings>("/admin/settings/trimesters", {
      method: "PUT",
      body: JSON.stringify(data),
    })
    return (json as { data?: SchoolSettings }).data ?? (json as SchoolSettings)
  },

  // Mettre à jour les paramètres de notification
  updateNotifications: async (data: NotificationUpdate): Promise<SchoolSettings> => {
    const json = await apiFetch<{ data?: SchoolSettings } | SchoolSettings>("/admin/settings/notifications", {
      method: "PUT",
      body: JSON.stringify(data),
    })
    return (json as { data?: SchoolSettings }).data ?? (json as SchoolSettings)
  },
}
