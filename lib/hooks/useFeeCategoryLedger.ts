"use client"

import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query"
import { feeCategoryLedgerApi, type LedgerCriteres } from "@/lib/api/fee-category-ledger"
import type { CategoryLedger } from "@/lib/contracts/fee-category-ledger"
import { pageSuivante } from "./pagination"

/** Ce qu'on demande d'un coup. Le reste vient par « Charger plus ». */
export const TAILLE_PAGE = 50

export const ledgerKeys = {
  all: ["fee-category-ledger"] as const,
  /**
   * La clé porte l'objet de critères ENTIER, jamais une énumération à la main.
   *
   * Énumérés un par un, le jour où un filtre s'ajoute et qu'on oublie de
   * l'inscrire ici, deux périmètres différents partagent une clé : l'écran
   * garde en cache la réponse du filtre précédent et ne se rafraîchit plus.
   * Le hachage de clé de TanStack Query est stable sur les objets.
   */
  point: (c: LedgerCriteres) => [...ledgerKeys.all, "point", c] as const,
}

/**
 * Le point sur une catégorie, pour le périmètre demandé, page après page.
 *
 * Fraîcheur courte : une caissière encaisse pendant qu'on lit le document, et
 * une minute de retard sur un total qu'on s'apprête à envoyer à un prestataire
 * est une minute de trop.
 *
 * **Les totaux ne sont pas la somme des pages.** Le serveur les calcule sur le
 * périmètre entier ; le seau, la recherche et la pagination ne bornent que la
 * liste. On reprend donc l'entête de la dernière page reçue — la plus fraîche —
 * et on ne concatène que `lignes`. Additionner les pages ferait monter le
 * « Entré » à chaque clic sur « Charger plus ».
 */
export function useFeeCategoryLedger(
  criteres: Partial<LedgerCriteres>,
  { enabled = true, size = TAILLE_PAGE }: { enabled?: boolean; size?: number } = {},
) {
  const pret = Boolean(criteres.categoryId) && Boolean(criteres.academicYearId) && enabled
  const complets = { ...criteres, size } as LedgerCriteres

  const requete = useInfiniteQuery({
    queryKey: pret ? ledgerKeys.point(complets) : [...ledgerKeys.all, "incomplet"],
    queryFn: ({ pageParam }: { pageParam: number }) =>
      feeCategoryLedgerApi.point({ ...complets, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (derniere: CategoryLedger, pages: unknown[]) =>
      pageSuivante({ items: derniere.lignes, size: derniere.size ?? size }, pages.length),
    enabled: pret,
    staleTime: 1000 * 15,
    // Pendant un changement d'onglet ou de période, on garde les chiffres
    // précédents et l'écran les grise, au lieu de les remplacer par des
    // squelettes : c'est l'écart entre l'avant et l'après qu'on lit à ce
    // moment-là, et un squelette l'efface.
    placeholderData: keepPreviousData,
  })

  const pages = requete.data?.pages
  const data: CategoryLedger | undefined = pages?.length
    ? {
        ...pages[pages.length - 1],
        lignes: pages.flatMap((page) => page.lignes),
      }
    : undefined

  return {
    ...requete,
    data,
    scrollInfini: {
      chargerSuite: () => void requete.fetchNextPage(),
      resteAcharger: Boolean(requete.hasNextPage),
      chargeEnCours: requete.isFetchingNextPage,
    },
  }
}
