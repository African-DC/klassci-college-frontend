export interface MultiComboboxOption<T extends number | string = number | string> {
  value: T
  label: string
  hint?: string
}

/** Minuscules et sans accents, pour une recherche tolérante (« eloise » trouve « Éloïse »). */
export function normaliseSearch(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim()
}

/** Recherche multi-mots indépendante de l'ordre, insensible aux accents et à la ponctuation. */
export function matchesSearch(haystack: string, search: string): boolean {
  const needle = normaliseSearch(search).replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean)
  if (!needle.length) return true
  const words = normaliseSearch(haystack).replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean)
  return needle.every((part) => words.some((word) => word.includes(part)))
}
