"use client"

import { useCallback, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { Route } from "next"

/**
 * Les filtres d'un écran, dans son adresse.
 *
 * Un état de filtre qui vit en mémoire ne se partage pas : « Tenue, 6e A, ce
 * mois-ci » ne s'envoie pas à un collègue, ne se met pas en favori, et le
 * bouton retour du navigateur quitte l'écran au lieu de défaire le dernier
 * filtre. Porté dans l'adresse, il devient un lien — et l'historique du
 * navigateur redevient l'annulation qu'on attend de lui.
 *
 * Aucun écran du dépôt ne le faisait ; celui-ci est donc la convention, pas
 * une seconde manière de faire à côté d'une première.
 *
 * **`push` ou `replace`, et pourquoi les deux.** Un choix discret — une
 * catégorie, une classe, un onglet — mérite une entrée d'historique : c'est
 * lui qu'on veut défaire. Une frappe au clavier, non : dix caractères tapés
 * dans la barre de recherche laisseraient dix entrées à remonter une par une.
 * Le second cas passe `historique: false`.
 *
 * Les paramètres qui ne sont pas dans `cles` ne sont jamais touchés : cet
 * écran n'est pas propriétaire de l'adresse entière.
 *
 * @param cles Les paramètres que cet écran possède. **Doit être une constante
 *   stable** (déclarée hors du composant) : recréée à chaque rendu, elle
 *   ferait recalculer les valeurs sans fin.
 */
export function useFiltresUrl<K extends string>(cles: readonly K[]) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  // La chaîne, pas l'objet : `useSearchParams` rend une nouvelle instance à
  // chaque rendu, et la comparer par identité relancerait tout à chaque fois.
  const signature = params.toString()

  const valeurs = useMemo(() => {
    const lus = new URLSearchParams(signature)
    const sortie = {} as Record<K, string>
    for (const cle of cles) sortie[cle] = lus.get(cle) ?? ""
    return sortie
  }, [signature, cles])

  const set = useCallback(
    (
      modifs: Partial<Record<K, string | number | undefined>>,
      { historique = true }: { historique?: boolean } = {},
    ) => {
      const suivants = new URLSearchParams(signature)
      for (const [cle, valeur] of Object.entries(modifs)) {
        // Vide vaut absent : une adresse ne porte pas `?classe=` pour dire
        // « toutes les classes ». Le lien partagé resterait juste, mais
        // illisible, et l'écart entre deux liens équivalents ferait douter.
        if (valeur === undefined || valeur === "") suivants.delete(cle)
        else suivants.set(cle, String(valeur))
      }
      const qs = suivants.toString()
      // `typedRoutes` refuse une chaîne construite : il ne peut pas vérifier
      // qu'elle désigne une page existante. Ici le chemin vient de
      // `usePathname` — donc de la page courante, qui existe par définition —
      // et seule la requête change. Le cast dit exactement cela.
      //
      // `tsc --noEmit` ne voit rien de tout ça : seul `next build` le voit,
      // et c'est ce qui a fait échouer la CI.
      const url = (qs ? `${pathname}?${qs}` : pathname) as Route
      if (historique) router.push(url, { scroll: false })
      else router.replace(url, { scroll: false })
    },
    [pathname, router, signature],
  )

  return { valeurs, set }
}
