import { apiFetch, apiFetchBlob, safeValidate } from "./client"
import {
  CouncilMinutesSchema,
  type CouncilMinutes,
  type CouncilDecisionUpdate,
} from "@/lib/contracts/council"

export const councilApi = {
  // Récupérer le PV d'une classe pour un trimestre donné
  getMinutes: async (classId: number, trimester: string): Promise<CouncilMinutes> => {
    const json = await apiFetch<{ data?: CouncilMinutes } | CouncilMinutes>(
      `/council-minutes?class_id=${classId}&trimester=${trimester}`,
    )
    const minutes = (json as { data?: CouncilMinutes }).data ?? (json as CouncilMinutes)
    return safeValidate(CouncilMinutesSchema, minutes, "GET /council-minutes")
  },

  // Mettre à jour les décisions de délibération
  updateDecisions: async (
    minutesId: number,
    decisions: CouncilDecisionUpdate[],
  ): Promise<CouncilMinutes> => {
    const json = await apiFetch<{ data?: CouncilMinutes } | CouncilMinutes>(
      `/council-minutes/${minutesId}/decisions`,
      { method: "PUT", body: JSON.stringify({ decisions }) },
    )
    const minutes = (json as { data?: CouncilMinutes }).data ?? (json as CouncilMinutes)
    return safeValidate(CouncilMinutesSchema, minutes, "PUT /council-minutes/decisions")
  },

  // Valider définitivement le PV
  validate: async (minutesId: number): Promise<CouncilMinutes> => {
    const json = await apiFetch<{ data?: CouncilMinutes } | CouncilMinutes>(
      `/council-minutes/${minutesId}/validate`,
      { method: "POST" },
    )
    const minutes = (json as { data?: CouncilMinutes }).data ?? (json as CouncilMinutes)
    return safeValidate(CouncilMinutesSchema, minutes, "POST /council-minutes/validate")
  },

  // Télécharger le PDF du PV
  downloadPdf: async (minutesId: number): Promise<Blob> => {
    return apiFetchBlob(`/council-minutes/${minutesId}/pdf`)
  },
}
