import type { PaginatedResponse } from "@/lib/contracts"

/** Plus grande page que l'API accepte : au-delà, elle répond par une liste vide. */
export const MAX_PAGE_SIZE = 100

/**
 * Garde-fou contre une API qui renverrait toujours une page pleine.
 * 200 pages de 100 lignes couvrent 20 000 enregistrements, bien au-delà
 * de l'effectif d'un établissement.
 */
const MAX_PAGES = 200

type ListFn<T> = (params: Record<string, unknown>) => Promise<PaginatedResponse<T>>

/**
 * Charge toutes les lignes d'une liste paginée, page après page.
 *
 * Un export ne peut pas se contenter de ce que l'écran a déjà chargé : la
 * liste arrive par pages de 20 au fil du défilement, et une classe de 45
 * élèves sortait en Excel avec 20 lignes.
 *
 * On s'arrête sur une page incomplète, comme le défilement continu, et sur
 * une page qui n'apporte aucune ligne nouvelle : la recherche approchée de
 * l'API renvoie les mêmes résultats quel que soit le numéro de page.
 */
export async function fetchAllPages<T extends { id: number }>(
  list: ListFn<T>,
  params: Record<string, unknown> = {},
): Promise<T[]> {
  const rows: T[] = []
  const seen = new Set<number>()

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const response = await list({ ...params, page, size: MAX_PAGE_SIZE })
    let added = 0
    for (const item of response.items) {
      if (seen.has(item.id)) continue
      seen.add(item.id)
      rows.push(item)
      added += 1
    }
    if (response.items.length < MAX_PAGE_SIZE || added === 0) return rows
  }
  throw new Error("Liste trop longue pour être exportée en une fois")
}
