import { InformationSheetSchema, type InformationSheet } from "@/lib/contracts/information-sheet"
import { apiFetch, safeValidate } from "./client"

/** La fiche de renseignements, pour une classe ou pour toutes celles d'une année. */
export const informationSheetApi = {
  forClass: async (classId: number): Promise<InformationSheet> => {
    const path = `/classes/${classId}/information-sheet`
    const json = await apiFetch<unknown>(path)
    return safeValidate(InformationSheetSchema, json, `GET ${path}`)
  },

  /** Sans année, le serveur prend l'année en cours. */
  forYear: async (academicYearId?: number): Promise<InformationSheet> => {
    const path = academicYearId
      ? `/information-sheet?academic_year_id=${academicYearId}`
      : "/information-sheet"
    const json = await apiFetch<unknown>(path)
    return safeValidate(InformationSheetSchema, json, "GET /information-sheet")
  },
}
