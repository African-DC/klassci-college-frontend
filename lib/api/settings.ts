import { getSession } from "next-auth/react"
import { z } from "zod"
import { apiFetch, handleExpiredSession, safeValidate } from "./client"
import {
  SchoolSettingsSchema,
  type SchoolSettings,
  type SchoolInfoUpdate,
  type TrimesterUpdate,
  type HolidaysUpdate,
  type NotificationUpdate,
} from "@/lib/contracts/settings"

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL
  if (!url) throw new Error("NEXT_PUBLIC_API_URL is not defined")
  return url
}

const LogoUploadResponseSchema = z.object({ logo_url: z.string() })

/** Lit le `detail` FastAPI pour afficher un message compréhensible à l'admin. */
async function readErrorDetail(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => null)) as { detail?: unknown } | null
  const detail = body?.detail
  if (typeof detail === "string") return detail
  if (Array.isArray(detail)) {
    const messages = detail
      .map((d: { msg?: string }) => (typeof d?.msg === "string" ? d.msg : null))
      .filter((m): m is string => Boolean(m))
    if (messages.length > 0) return messages.join(", ")
  }
  return fallback
}

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

  // Upload multipart : ne passe pas par apiFetch (JSON), on réplique le contrat 401.
  uploadLogo: async (file: File): Promise<{ logo_url: string }> => {
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
    const res = await fetch(`${getBaseUrl()}/admin/settings/logo`, {
      method: "POST",
      headers,
      body: formData,
    })
    if (res.status === 401) {
      if (hadToken) void handleExpiredSession()
      throw new Error("Session expirée")
    }
    if (!res.ok) {
      throw new Error(await readErrorDetail(res, "Échec de l'envoi du logo"))
    }
    const data = await res.json()
    return safeValidate(LogoUploadResponseSchema, data, "POST /admin/settings/logo")
  },

  deleteLogo: async (): Promise<void> => {
    await apiFetch<void>("/admin/settings/logo", { method: "DELETE" })
  },
}
