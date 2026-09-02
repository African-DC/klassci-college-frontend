import { apiFetch, apiFetchBlob, safeValidate } from "./client"
import { SettlementMatrixSchema, type SettlementMatrix } from "@/lib/contracts/fee-settlement"

function unwrap(json: unknown): unknown {
  if (json !== null && typeof json === "object") {
    const obj = json as Record<string, unknown>
    if (obj.data !== undefined) return obj.data
  }
  return json
}

export const feeSettlementApi = {
  /** Le tableau d'une classe : une ligne par élève, une colonne par catégorie. */
  matrix: async (classId: number, academicYearId: number): Promise<SettlementMatrix> => {
    const query = `?class_id=${classId}&academic_year_id=${academicYearId}`
    const json = await apiFetch<unknown>(`/payments/settlement${query}`)
    return safeValidate(SettlementMatrixSchema, unwrap(json), "GET /payments/settlement")
  },

  /** Le même tableau en classeur, pour se relire hors ligne. */
  export: async (classId: number, academicYearId: number): Promise<Blob> => {
    const query = `?class_id=${classId}&academic_year_id=${academicYearId}`
    return apiFetchBlob(`/payments/settlement/export${query}`)
  },
}
