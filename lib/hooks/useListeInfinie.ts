"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import { pageSuivante } from "./pagination"

/**
 * Ce que ce hook lit d'une page, et rien d'autre.
 *
 * Exiger la réponse paginée complète excluait les registres de vie
 * scolaire, qui portent des champs en plus et pas `total_pages`. Décrire
 * les seuls champs utilisés laisse chaque appelant garder sa forme.
 */
export interface PageServie<T> {
  items: T[]
  size: number
  total: number
}

interface Options {
  /** Faux quand la liste ne doit pas encore être demandée (filtre incomplet). */
  enabled?: boolean
  staleTime?: number
}

/**
 * N'importe quelle liste paginée, chargée au fil du défilement.
 *
 * Les tables construites sur `createCrudHooks` ont leur propre variante ;
 * celle-ci sert aux listes qui appellent leur API directement — corbeille,
 * registre des convocations, billets d'annulation, historique des appels.
 *
 * `aplatie` rend la forme d'une page unique : `items` vient de toutes les
 * pages chargées, `total` reste celui annoncé par le serveur. C'est cette
 * distinction qui permet à un pied de page de dire « 40 sur 312 » au lieu de
 * laisser croire que 40 est le compte.
 */
export function useListeInfinie<T, P extends PageServie<T>>(
  cle: readonly unknown[],
  charger: (page: number) => Promise<P>,
  { enabled = true, staleTime = 1000 * 30 }: Options = {},
) {
  const requete = useInfiniteQuery({
    queryKey: [...cle, "infinie"] as const,
    queryFn: ({ pageParam }: { pageParam: number }) => charger(pageParam),
    initialPageParam: 1,
    getNextPageParam: (derniere: P, pages: unknown[]) =>
      pageSuivante(derniere, pages.length),
    enabled,
    staleTime,
  })

  const pages = requete.data?.pages
  const aplatie: P | undefined = pages?.length
    ? { ...pages[0], items: pages.flatMap((page) => page.items) }
    : undefined

  return {
    ...requete,
    data: aplatie,
    scrollInfini: {
      chargerSuite: () => void requete.fetchNextPage(),
      resteAcharger: Boolean(requete.hasNextPage),
      chargeEnCours: requete.isFetchingNextPage,
    },
  }
}
