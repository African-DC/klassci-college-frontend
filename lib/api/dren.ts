import { apiFetch, apiFetchBlob, safeValidate } from "./client"
import { DrenStatsSchema, type DrenStats } from "@/lib/contracts/dren"

export const drenApi = {
  // Récupérer les statistiques agrégées pour une année académique
  getStats: async (academicYearId: number): Promise<DrenStats> => {
    const json = await apiFetch<{ data?: DrenStats } | DrenStats>(
      `/reports/dren-stats/${academicYearId}`,
    )
    const stats = (json as { data?: DrenStats }).data ?? (json as DrenStats)
    return safeValidate(DrenStatsSchema, stats, "GET /reports/dren-stats")
  },

  // Télécharger le classeur Excel (authentifié)
  downloadExcel: (academicYearId: number): Promise<Blob> =>
    apiFetchBlob(`/reports/dren-stats/${academicYearId}/export?format=xlsx`),

  // Télécharger le PDF (authentifié)
  downloadPdf: (academicYearId: number): Promise<Blob> =>
    apiFetchBlob(`/reports/dren-stats/${academicYearId}/export?format=pdf`),
}
