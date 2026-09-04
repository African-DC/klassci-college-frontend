"use client"

import { useQuery } from "@tanstack/react-query"
import { feeCategoryOverviewApi, type OverviewPerimetre } from "@/lib/api/fee-category-overview"

export const overviewKeys = {
  all: ["fee-category-overview"] as const,
  /**
   * La clé porte le périmètre ENTIER, jamais une énumération à la main : un
   * critère oublié ici ferait partager une clé à deux périmètres différents, et
   * l'écran garderait en cache la réponse du filtre précédent.
   */
  liste: (p: OverviewPerimetre) => [...overviewKeys.all, "liste", p] as const,
}

/**
 * Quel frais rentre mal — la question qui vient AVANT le choix d'une catégorie.
 *
 * Une requête pour toutes les catégories, pas une par frais : le serveur groupe
 * une fois, et l'écran compare. Boucler ici referait N fois la même lecture et
 * rendrait la comparaison plus lente que l'ouverture successive qu'elle
 * remplace.
 *
 * Fraîcheur courte, comme le détail : une caissière encaisse pendant qu'on lit,
 * et c'est sur ces cartes qu'on décide quel frais relancer.
 */
export function useFeeCategoryOverview(
  perimetre: Partial<OverviewPerimetre>,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const pret = Boolean(perimetre.academicYearId) && enabled
  const complet = perimetre as OverviewPerimetre

  return useQuery({
    queryKey: pret ? overviewKeys.liste(complet) : [...overviewKeys.all, "incomplet"],
    queryFn: () => feeCategoryOverviewApi.liste(complet),
    enabled: pret,
    staleTime: 1000 * 15,
    // Une route que le serveur ne porte pas encore ne se répare pas en
    // réessayant : trois tentatives ne feraient que retarder le repli.
    retry: 1,
  })
}
