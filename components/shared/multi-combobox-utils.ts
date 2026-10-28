export interface MultiComboboxOption {
  value: number | string
  label: string
  hint?: string
}

/** Minuscules et sans accents, pour une recherche tolérante (« eloise » trouve « Éloïse »). */
export function normaliseSearch(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim()
}

export function matchesSearch(haystack: string, search: string): boolean {
  const needle = normaliseSearch(search)
  if (!needle) return true
  return normaliseSearch(haystack).includes(needle)
}
