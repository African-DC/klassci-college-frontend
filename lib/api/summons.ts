import { apiFetch, apiFetchBlob, safeValidate } from "./client"
import {
  ParentSummonsRegisterSchema,
  ParentSummonsSchema,
  type ParentSummons,
  type ParentSummonsCreate,
  type ParentSummonsRegister,
  type SummonsOutcomeUpdate,
} from "@/lib/contracts/school-life"

export interface SummonsRegisterFilters {
  academic_year_id?: number
  trimester?: number
  student_id?: number
  outcome?: string
}

function toQuery(filters: SummonsRegisterFilters): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value))
  }
  const qs = query.toString()
  return qs ? `?${qs}` : ""
}

/** Convocations de parents : émission, registre, suite donnée, document. */
export const summonsApi = {
  list: async (filters: SummonsRegisterFilters = {}): Promise<ParentSummonsRegister> => {
    const path = `/school-life/summons${toQuery(filters)}`
    const json = await apiFetch<unknown>(path)
    return safeValidate(ParentSummonsRegisterSchema, json, `GET ${path}`)
  },

  get: async (id: number): Promise<ParentSummons> => {
    const json = await apiFetch<unknown>(`/school-life/summons/${id}`)
    return safeValidate(ParentSummonsSchema, json, `GET /school-life/summons/${id}`)
  },

  create: async (data: ParentSummonsCreate): Promise<ParentSummons> => {
    // Le backend refuse `undefined` autant que nous : on ne transmet que les
    // champs réellement renseignés au guichet.
    const body: Record<string, unknown> = {
      student_id: data.student_id,
      summons_date: data.summons_date,
      summons_time: data.summons_time,
      reason: data.reason,
    }
    if (data.parent_id != null) body.parent_id = data.parent_id
    if (data.parent_name?.trim()) body.parent_name = data.parent_name.trim()
    if (data.trimester != null) body.trimester = data.trimester

    const json = await apiFetch<unknown>("/school-life/summons", {
      method: "POST",
      body: JSON.stringify(body),
    })
    return safeValidate(ParentSummonsSchema, json, "POST /school-life/summons")
  },

  recordOutcome: async (id: number, data: SummonsOutcomeUpdate): Promise<ParentSummons> => {
    const json = await apiFetch<unknown>(`/school-life/summons/${id}/outcome`, {
      method: "PATCH",
      body: JSON.stringify({
        outcome: data.outcome,
        notes: data.notes?.trim() ? data.notes.trim() : null,
      }),
    })
    return safeValidate(ParentSummonsSchema, json, `PATCH /school-life/summons/${id}/outcome`)
  },

  downloadDocument: (id: number): Promise<Blob> =>
    apiFetchBlob(`/school-life/summons/${id}/document.pdf`),
}
