/**
 * Recherche « intelligente » côté client : insensible à la casse ET aux
 * accents (Mme Diallo tape "traore" et trouve "Traoré"), tokenisée en ET
 * (chaque mot de la requête doit matcher au moins un champ).
 *
 * Utilisé par les listes admin/portails pour un filtre multi-champs instantané.
 */

// Marques diacritiques combinantes (U+0300 à U+036F) supprimées après NFD.
const DIACRITICS = /[̀-ͯ]/g

/** Minuscule + suppression des diacritiques (é → e, ï → i, ç → c…). */
export function normalizeText(value: string): string {
  return value.normalize("NFD").replace(DIACRITICS, "").toLowerCase().trim()
}

/**
 * Vrai si la requête matche les champs fournis. Chaque token (mot) de la
 * requête doit apparaître dans au moins un des champs (logique ET entre tokens,
 * OU entre champs). Une requête vide matche toujours.
 *
 * @param fields  Les valeurs textuelles de l'entité (nom, matricule, email…).
 * @param query   La saisie utilisateur.
 */
export function matchesSearch(
  fields: Array<string | null | undefined | number>,
  query: string,
): boolean {
  const q = normalizeText(query)
  if (!q) return true
  const haystack = normalizeText(
    fields
      .filter((f) => f !== null && f !== undefined && f !== "")
      .map(String)
      .join(" "),
  )
  return q.split(/\s+/).every((token) => haystack.includes(token))
}
