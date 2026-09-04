import { apiFetch, safeValidate } from "./client"
import { lendemain } from "./fee-category-ledger"
import {
  FeeCategoryOverviewSchema,
  type FeeCategoryOverview,
} from "@/lib/contracts/fee-category-overview"

/**
 * Le périmètre de la vue d'ensemble.
 *
 * **L'année est obligatoire, comme sur le détail.** Sans elle, l'attendu et le
 * taux additionneraient tous les exercices de la base, et la carte
 * n'annoncerait pas le total du détail qu'elle ouvre. La classe et la période
 * sont facultatives et réduisent, exactement comme en dessous.
 */
export interface OverviewPerimetre {
  academicYearId: number
  classId?: number
  /** Bornes de période, au format `YYYY-MM-DD`. */
  dateFrom?: string
  dateTo?: string
}

export const feeCategoryOverviewApi = {
  /** Une ligne par catégorie active : ce qui est entré, ce qui est attendu, le taux. */
  liste: async (perimetre: OverviewPerimetre): Promise<FeeCategoryOverview> => {
    const params = new URLSearchParams({
      academic_year_id: String(perimetre.academicYearId),
    })
    if (perimetre.classId) params.set("class_id", String(perimetre.classId))
    if (perimetre.dateFrom) params.set("date_from", perimetre.dateFrom)
    if (perimetre.dateTo) params.set("date_to", lendemain(perimetre.dateTo))

    const json = await apiFetch<unknown>(`/payments/settlement/overview?${params.toString()}`)
    return safeValidate(FeeCategoryOverviewSchema, json, "GET /payments/settlement/overview")
  },
}
