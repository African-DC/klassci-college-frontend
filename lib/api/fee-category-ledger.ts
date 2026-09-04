import { apiFetch, apiFetchBlob, safeValidate } from "./client"
import {
  CategoryLedgerSchema,
  type CategoryLedger,
  type LedgerBucket,
} from "@/lib/contracts/fee-category-ledger"

/** Ce sur quoi porte le document : une catégorie, une année, une classe, une période. */
export interface LedgerPerimetre {
  categoryId: number
  academicYearId: number
  classId?: number
  /** Bornes de période, au format `YYYY-MM-DD`. */
  dateFrom?: string
  dateTo?: string
}

/**
 * Le périmètre, plus ce qui ne borne QUE la liste.
 *
 * Le seau, la recherche et la pagination ne changent ni les totaux ni les
 * compteurs : le serveur les calcule sur le périmètre entier, sinon le chiffre
 * du haut de page descendrait à chaque page tournée.
 */
export interface LedgerCriteres extends LedgerPerimetre {
  state?: LedgerBucket
  q?: string
  page?: number
  size?: number
}

function perimetre({
  categoryId,
  academicYearId,
  classId,
  dateFrom,
  dateTo,
}: LedgerPerimetre): URLSearchParams {
  const params = new URLSearchParams({
    category_id: String(categoryId),
    academic_year_id: String(academicYearId),
  })
  if (classId) params.set("class_id", String(classId))
  if (dateFrom) params.set("date_from", dateFrom)
  if (dateTo) params.set("date_to", lendemain(dateTo))
  return params
}

function requete(criteres: LedgerCriteres): URLSearchParams {
  const params = perimetre(criteres)
  if (criteres.state) params.set("state", criteres.state)
  if (criteres.q) params.set("q", criteres.q)
  if (criteres.page) params.set("page", String(criteres.page))
  if (criteres.size) params.set("size", String(criteres.size))
  return params
}

/**
 * Borne haute exclusive côté serveur : on envoie le lendemain pour que la
 * journée choisie soit incluse. Sans cela, un document « jusqu'au 30 »
 * s'arrêterait au 29 au soir, et personne ne verrait la différence avant de
 * comparer deux totaux.
 *
 * Exportée parce que la vue d'ensemble borne la même période sur le même
 * serveur : deux conversions écrites séparément finiraient par différer d'un
 * jour, et la carte n'annoncerait plus le total du détail qu'elle ouvre.
 */
export function lendemain(jour: string): string {
  const d = new Date(`${jour}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

export const feeCategoryLedgerApi = {
  /** Le point sur une catégorie : entré en argent, en nature, et dû. */
  point: async (criteres: LedgerCriteres): Promise<CategoryLedger> => {
    const json = await apiFetch<unknown>(`/payments/settlement/category?${requete(criteres)}`)
    return safeValidate(CategoryLedgerSchema, json, "GET /payments/settlement/category")
  },

  /**
   * Le même document, en PDF ou en classeur.
   *
   * **Il porte le périmètre entier, jamais l'onglet ni la recherche.** Le
   * serveur ne les accepte pas sur cette route, et c'est délibéré : un classeur
   * amputé d'un filtre qu'il ne nomme pas se lirait comme le point complet, et
   * c'est la pièce qu'un prestataire garde. L'écran doit donc le dire dès qu'un
   * seau ou une recherche est actif — les envoyer ici ne ferait que les taire.
   *
   * `inline` sert l'aperçu : le serveur renvoie alors le PDF en affichage au
   * lieu du téléchargement. Un comptable qui vérifie une période avant de
   * l'envoyer à un prestataire ne veut pas six fichiers dans son dossier.
   */
  export: async (
    criteres: LedgerPerimetre,
    { format = "pdf", inline = false }: { format?: "pdf" | "xlsx"; inline?: boolean } = {},
  ): Promise<Blob> => {
    const params = perimetre(criteres)
    params.set("format", format)
    if (inline) params.set("inline", "true")
    return apiFetchBlob(`/payments/settlement/category/export?${params.toString()}`)
  },
}
