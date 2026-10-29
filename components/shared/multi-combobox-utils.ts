export interface MultiComboboxOption<T extends number | string = number | string> {
  value: T
  label: string
  hint?: string
  /** Optional supplementary terms (email, speciality, identifier). */
  searchText?: string
}

/** A stable comparison form: case, accents, punctuation and whitespace independent. */
export function normaliseSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}

function distanceAtMost(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const current = [i]
    let minimum = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost)
      minimum = Math.min(minimum, current[j])
    }
    if (minimum > max) return false
    previous = current
  }
  return previous[b.length] <= max
}

/**
 * Every query word must be represented, in any order. Exact tokens win over
 * prefixes, then conservative typo tolerance (no fuzzy matching of short words).
 * This avoids irrelevant teachers appearing for one or two letter queries.
 */
export function searchScore(haystack: string, search: string): number {
  const query = normaliseSearch(search)
  if (!query) return 1
  const target = normaliseSearch(haystack)
  if (!target) return 0
  if (target === query) return 100
  if (target.includes(query)) return 95

  const words = target.split(" ")
  const queryWords = query.split(" ")
  let score = 90
  for (const word of queryWords) {
    if (words.includes(word)) continue
    if (word.length >= 2 && words.some((part) => part.startsWith(word))) {
      score = Math.min(score, 80)
      continue
    }
    const allowedErrors = word.length >= 8 ? 2 : word.length >= 5 ? 1 : 0
    if (allowedErrors && words.some((part) => distanceAtMost(part, word, allowedErrors))) {
      score = Math.min(score, 55)
      continue
    }
    return 0
  }
  return score
}

export function matchesSearch(haystack: string, search: string): boolean {
  return searchScore(haystack, search) > 0
}
