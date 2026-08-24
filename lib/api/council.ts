import { apiFetch, apiFetchBlob, safeValidate } from "./client"
import {
  CouncilMinutesSchema,
  type CouncilMinutes,
  type CouncilDecisionUpdate,
} from "@/lib/contracts/council"

function unwrap(json: unknown): unknown {
  if (json !== null && typeof json === "object" && "data" in json) {
    const data = (json as Record<string, unknown>).data
    if (data !== undefined) return data
  }
  return json
}

export interface CouncilGenerateInput {
  class_id: number
  trimester: number
  academic_year_id: number
}

export const councilApi = {
  // Récupérer le PV d'une classe/trimestre/année. Le BE attend les segments de
  // chemin (class_id, trimester) + academic_year_id en query.
  getMinutes: async (
    classId: number,
    trimester: string,
    academicYearId: number,
  ): Promise<CouncilMinutes> => {
    const json = await apiFetch<unknown>(
      `/reports/council-minutes/${classId}/${trimester}?academic_year_id=${academicYearId}`,
    )
    return safeValidate(CouncilMinutesSchema, unwrap(json), "GET /reports/council-minutes")
  },

  // Générer le PV à partir des bulletins (délibération auto par élève).
  generateMinutes: async (data: CouncilGenerateInput): Promise<CouncilMinutes> => {
    const json = await apiFetch<unknown>(`/reports/council-minutes/generate`, {
      method: "POST",
      body: JSON.stringify(data),
    })
    return safeValidate(
      CouncilMinutesSchema,
      unwrap(json),
      "POST /reports/council-minutes/generate",
    )
  },

  // Mettre à jour les décisions de délibération (lot).
  updateDecisions: async (
    minutesId: number,
    decisions: CouncilDecisionUpdate[],
  ): Promise<CouncilMinutes> => {
    const json = await apiFetch<unknown>(
      `/reports/council-minutes/${minutesId}/decisions`,
      { method: "PUT", body: JSON.stringify({ decisions }) },
    )
    return safeValidate(
      CouncilMinutesSchema,
      unwrap(json),
      "PUT /reports/council-minutes/decisions",
    )
  },

  // Valider définitivement le PV.
  validate: async (minutesId: number): Promise<CouncilMinutes> => {
    const json = await apiFetch<unknown>(
      `/reports/council-minutes/${minutesId}/validate`,
      { method: "POST" },
    )
    return safeValidate(
      CouncilMinutesSchema,
      unwrap(json),
      "POST /reports/council-minutes/validate",
    )
  },

  // Télécharger le PDF du PV (segments class_id/trimester + academic_year_id).
  downloadPdf: async (
    classId: number,
    trimester: number,
    academicYearId: number,
  ): Promise<Blob> => {
    return apiFetchBlob(
      `/reports/council-minutes/${classId}/${trimester}/pdf?academic_year_id=${academicYearId}`,
    )
  },
}
