import { apiFetch, apiFetchBlob, safeValidate } from "./client"
import { CategoryLedgerSchema, type CategoryLedger } from "@/lib/contracts/fee-category-ledger"

export interface LedgerCriteres {
  categoryId: number
  academicYearId: number
  classId?: number
  /** Bornes de période, au format `YYYY-MM-DD`. */
  dateFrom?: string
  dateTo?: string
}

function requete({ categoryId, academicYearId, classId, dateFrom, dateTo }: LedgerCriteres): string {
  const params = new URLSearchParams({
    category_id: String(categoryId),
    academic_year_id: String(academicYearId),
  })
  if (classId) params.set("class_id", String(classId))
  if (dateFrom) params.set("date_from", dateFrom)
  // Borne haute exclusive côté serveur : on envoie le lendemain pour que la
  // journée choisie soit incluse. Sans cela, un document « jusqu'au 30 »
  // s'arrêterait au 29 au soir, et personne ne verrait la différence avant de
  // comparer deux totaux.
  if (dateTo) params.set("date_to", lendemain(dateTo))
  return `?${params.toString()}`
}

function lendemain(jour: string): string {
  const d = new Date(`${jour}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

export const feeCategoryLedgerApi = {
  /** Le point sur une catégorie : entré en argent, en nature, et dû. */
  point: async (criteres: LedgerCriteres): Promise<CategoryLedger> => {
    const json = await apiFetch<unknown>(`/payments/settlement/category${requete(criteres)}`)
    return safeValidate(CategoryLedgerSchema, json, "GET /payments/settlement/category")
  },

  /** Le même document, en classeur. */
  export: async (criteres: LedgerCriteres): Promise<Blob> =>
    apiFetchBlob(`/payments/settlement/category/export${requete(criteres)}`),
}
