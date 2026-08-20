import { z } from "zod"
import { apiFetch, apiFetchBlob, safeValidate } from "./client"
import {
  RetakeAuthorizationSchema,
  type RetakeAuthorization,
  type RetakeAuthorizationCreate,
} from "@/lib/contracts/school-life"

const RetakeAuthorizationArraySchema = z.array(RetakeAuthorizationSchema)

export interface RetakeListFilters {
  academic_year_id?: number
  trimester?: number
  student_id?: number
}

function toQuery(filters: RetakeListFilters): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value))
  }
  const qs = query.toString()
  return qs ? `?${qs}` : ""
}

/** Billets d'annulation de zéro : autorisation de rattrapage et son document. */
export const retakesApi = {
  list: async (filters: RetakeListFilters = {}): Promise<RetakeAuthorization[]> => {
    const path = `/school-life/retake-authorizations${toQuery(filters)}`
    const json = await apiFetch<unknown>(path)
    return safeValidate(RetakeAuthorizationArraySchema, json, `GET ${path}`)
  },

  create: async (data: RetakeAuthorizationCreate): Promise<RetakeAuthorization> => {
    const json = await apiFetch<unknown>("/school-life/retake-authorizations", {
      method: "POST",
      body: JSON.stringify({
        student_id: data.student_id,
        period_start: data.period_start,
        period_end: data.period_end,
        reason: data.reason,
        evaluation_ids: data.evaluation_ids,
      }),
    })
    return safeValidate(
      RetakeAuthorizationSchema,
      json,
      "POST /school-life/retake-authorizations",
    )
  },

  downloadDocument: (id: number): Promise<Blob> =>
    apiFetchBlob(`/school-life/retake-authorizations/${id}/document.pdf`),
}
