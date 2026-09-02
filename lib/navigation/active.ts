/**
 * Quelle entrée du menu est celle où l'on se trouve.
 *
 * Le préfixe seul ne suffit plus depuis que le menu porte des groupes :
 * `/admin/payments` est un préfixe de `/admin/payments/soldes`, et les deux
 * entrées s'allumaient ensemble. On ne saurait alors plus laquelle on lit.
 *
 * La règle est celle qu'un lecteur applique sans y penser : **c'est le chemin
 * le plus précis qui gagne.** Elle vaut pour n'importe quel menu, y compris
 * ceux qu'on ajoutera plus tard, et ne demande rien à la forme du modèle.
 */
export function correspond(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/")
}

/**
 * Parmi plusieurs destinations, celle qui décrit le mieux l'endroit courant.
 *
 * Rend `null` quand aucune ne correspond — un menu peut très bien n'avoir
 * aucune entrée active, sur une page qu'il ne référence pas.
 */
export function plusPrecise(pathname: string, hrefs: readonly string[]): string | null {
  const candidats = hrefs.filter((href) => correspond(pathname, href))
  if (candidats.length === 0) return null
  return candidats.reduce((a, b) => (b.length > a.length ? b : a))
}
