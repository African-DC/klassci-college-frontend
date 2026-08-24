/** Une page rendue par l'API, réduite à ce qui décide de la suite. */
export interface PageRendue {
  items: unknown[]
  size: number
}

/**
 * Le numéro de la page suivante, ou `undefined` quand tout est chargé.
 *
 * On s'arrête dès que la page rendue est plus courte que demandée, plutôt
 * que de comparer au total annoncé. Le total est vrai au moment où il est
 * calculé : entre deux requêtes, une caissière enregistre un versement et un
 * collègue en annule un autre. Se fier au compte fait alors soit boucler sur
 * une page vide, soit s'arrêter avant la fin.
 */
export function pageSuivante(derniere: PageRendue, pagesChargees: number): number | undefined {
  const taille = derniere.size || 20
  return derniere.items.length < taille ? undefined : pagesChargees + 1
}
