/**
 * Types + helpers partagés du mode dictée. `undefined` = pas saisi,
 * `null` = absent, `number` = note /20.
 */
export type EntryValue = number | null | undefined

/** Affichage FR d'une valeur : "—" (non saisi), "Absent", ou la note. */
export function formatEntry(v: EntryValue): string {
  if (v === undefined) return "—"
  if (v === null) return "Absent"
  return Number.isInteger(v) ? String(v) : v.toString().replace(".", ",")
}

/** Classe de couleur (texte, thème dark) selon la valeur — sémantique. */
export function entryToneClass(v: EntryValue): string {
  if (v === undefined) return "text-white/40"
  if (v === null) return "text-amber-300"
  if (v < 10) return "text-rose-300"
  if (v < 14) return "text-amber-300"
  return "text-emerald-300"
}
