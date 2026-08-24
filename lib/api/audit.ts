import {
  AuditFiltersSchema,
  AuditListSchema,
  type AuditFilters,
  type AuditList,
  type AuditQuery,
} from "@/lib/contracts/audit"
import { apiFetch, safeValidate } from "./client"

function toSearchParams(query: AuditQuery): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value))
    }
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

export const auditApi = {
  list: async (query: AuditQuery = {}): Promise<AuditList> => {
    const json = await apiFetch<unknown>(`/admin/audit${toSearchParams(query)}`)
    return safeValidate(AuditListSchema, json, "GET /admin/audit")
  },

  /** Entités, actions et personnes réellement présentes dans le journal visible. */
  filters: async (): Promise<AuditFilters> => {
    const json = await apiFetch<unknown>("/admin/audit/filters")
    return safeValidate(AuditFiltersSchema, json, "GET /admin/audit/filters")
  },
}
