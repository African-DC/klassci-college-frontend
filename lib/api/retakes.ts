import { z } from "zod"
import { apiFetch, apiFetchBlob, safeValidate } from "./client"
import {
  RetakeAuthorizationListSchema,
  RetakeAuthorizationSchema,
  RetakeTargetSchema,
  type RetakeAuthorization,
  type RetakeAuthorizationCreate,
  type RetakeAuthorizationList,
  type RetakeTarget,
} from "@/lib/contracts/school-life"

const RetakeTargetArraySchema = z.array(RetakeTargetSchema)

export interface RetakeListFilters {
  academic_year_id?: number
  trimester?: number
  student_id?: number
  page?: number
  size?: number
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
  list: async (filters: RetakeListFilters = {}): Promise<RetakeAuthorizationList> => {
    const path = `/school-life/retake-authorizations${toQuery(filters)}`
    const json = await apiFetch<unknown>(path)
    return safeValidate(RetakeAuthorizationListSchema, json, `GET ${path}`)
  },

  /**
   * Évaluations que l'élève a manquées sur la période, donc les seules que le
   * billet peut rouvrir. Le croisement est fait par le serveur : le refaire
   * ici supposait de lire le cahier de notes de la classe, un droit que le
   * bureau de la vie scolaire n'a pas.
   */
  missedEvaluations: async (
    studentId: number,
    periodStart: string,
    periodEnd: string,
  ): Promise<RetakeTarget[]> => {
    const query = new URLSearchParams({ from: periodStart, to: periodEnd })
    const path = `/school-life/students/${studentId}/missed-evaluations?${query.toString()}`
    const json = await apiFetch<unknown>(path)
    return safeValidate(RetakeTargetArraySchema, json, `GET ${path}`)
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
