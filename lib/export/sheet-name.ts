/** Caractères qu'Excel refuse dans un nom de feuille. */
const FORBIDDEN = /[\\/?*[\]:]/g
const MAX_LENGTH = 31

/** Excel refuse une apostrophe en tête ou en fin de nom. */
function trimApostrophes(value: string): string {
  return value.replace(/^['\s]+|['\s]+$/g, "")
}

/**
 * Un nom de feuille qu'Excel accepte et qui ne double aucun autre.
 *
 * Excel refuse `\ / ? * [ ] :`, plus de 31 caractères, un nom vide, une
 * apostrophe en tête ou en fin, et deux feuilles de même nom (sans tenir
 * compte de la casse). « T/A 1 » devient « T A 1 » ; deux classes que la
 * coupe à 31 caractères rendrait identiques reçoivent « (2) », « (3) ».
 * Les apostrophes sont retirées à nouveau après chaque coupe : couper peut
 * en laisser une en fin de nom.
 */
export function worksheetName(name: string, used: Set<string> = new Set()): string {
  const spaced = name.replace(FORBIDDEN, " ").replace(/\s+/g, " ")
  const clean = trimApostrophes(trimApostrophes(spaced).slice(0, MAX_LENGTH)) || "Feuille"
  let candidate = clean
  for (let n = 2; used.has(candidate.toLowerCase()); n += 1) {
    const suffix = ` (${n})`
    candidate = `${trimApostrophes(clean.slice(0, MAX_LENGTH - suffix.length))}${suffix}`
  }
  used.add(candidate.toLowerCase())
  return candidate
}
