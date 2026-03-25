import { apiFetch, safeValidate } from "./client"
import { DrenStatsSchema, type DrenStats } from "@/lib/contracts/dren"

export const drenApi = {
  // Récupérer les statistiques agrégées pour une année académique
  getStats: async (academicYearId: number): Promise<DrenStats> => {
    const json = await apiFetch<{ data?: DrenStats } | DrenStats>(
      `/reports/dren?academic_year_id=${academicYearId}`,
    )
    const stats = (json as { data?: DrenStats }).data ?? (json as DrenStats)
    return safeValidate(DrenStatsSchema, stats, "GET /reports/dren")
  },

  // Télécharger l'export Excel
  downloadExcel: async (academicYearId: number): Promise<Blob> => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL
    if (!baseUrl) throw new Error("NEXT_PUBLIC_API_URL is not defined")
    const res = await fetch(`${baseUrl}/reports/dren/excel?academic_year_id=${academicYearId}`)
    if (!res.ok) throw new Error("Impossible de télécharger le fichier Excel")
    return res.blob()
  },

  // Télécharger l'export PDF
  downloadPdf: async (academicYearId: number): Promise<Blob> => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL
    if (!baseUrl) throw new Error("NEXT_PUBLIC_API_URL is not defined")
    const res = await fetch(`${baseUrl}/reports/dren/pdf?academic_year_id=${academicYearId}`)
    if (!res.ok) throw new Error("Impossible de télécharger le fichier PDF")
    return res.blob()
  },
}
