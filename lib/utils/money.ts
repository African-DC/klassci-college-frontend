/**
 * Formatage des montants, en un seul endroit.
 *
 * Le FCFA n'a pas de subdivision en usage courant : on n'affiche jamais de
 * décimales, et on arrondit plutôt que de laisser fuir un `,00` ou un
 * `1234.5678` venu d'un calcul de répartition.
 *
 * Le séparateur de milliers français (espace insécable fine) vient de
 * `toLocaleString("fr-FR")`, cohérent avec le reste de l'interface.
 */
export function formatFcfa(amount: number): string {
  return `${Math.round(amount).toLocaleString("fr-FR")} FCFA`
}

/** Montant nu, sans devise — pour les tableaux où la colonne porte déjà l'unité. */
export function formatAmount(amount: number): string {
  return Math.round(amount).toLocaleString("fr-FR")
}
