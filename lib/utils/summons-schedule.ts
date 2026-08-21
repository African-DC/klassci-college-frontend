/**
 * Règles de calendrier des convocations de parent.
 *
 * Le backend refuse de consigner la suite donnée avant le jour du rendez-vous
 * (`summons_date > date.today()`). Le registre étant trié du plus récent au
 * plus ancien, les rendez-vous à venir sont les premières lignes de l'écran :
 * y laisser un bouton actif, c'est promettre un geste que le serveur rejette
 * systématiquement.
 */

/** Date du jour au format « AAAA-MM-JJ », dans le fuseau du navigateur. */
export function todayIso(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}

/**
 * La suite donnée peut-elle être consignée ?
 *
 * Oui à partir du jour du rendez-vous. Les deux dates sont comparées au format
 * « AAAA-MM-JJ », qui se trie comme du texte : pas de conversion en Date, donc
 * pas de décalage de fuseau qui ferait basculer la veille au lendemain.
 */
export function canRecordSummonsOutcome(
  summonsDate: string,
  today: string = todayIso(),
): boolean {
  if (!summonsDate) return true
  return summonsDate.slice(0, 10) <= today
}

/** Pourquoi le bouton est désactivé, dit à l'éducateur. */
export const SUMMONS_OUTCOME_TOO_EARLY =
  "La suite se consigne à partir du jour du rendez-vous."
