/**
 * Un montant, écrit comme le reste de l'écran d'encaissement l'écrit déjà.
 * Le libellé XOF est celui de l'aperçu d'allocation et du reçu : deux unités
 * différentes dans la même boîte feraient douter du total.
 */
export function formatXof(value: number): string {
  return `${Number(value).toLocaleString("fr-FR")} XOF`
}
