/**
 * Parser robuste pour les notes saisies à la main.
 *
 * Accepte les phrasings courants en CI :
 * - "12"        → 12
 * - "12.5"      → 12.5
 * - "12,5"      → 12.5  (virgule française)
 * - "12. 5"     → 12.5  (espace après point)
 * - "12, 5"     → 12.5  (espace après virgule)
 * - "  14  "    → 14    (whitespace)
 * - ""          → null  (vide = pas saisi)
 * - "absent"    → null  (mais avec flag distinct)
 *
 * Retourne null si invalide ou hors borne [0, 20].
 *
 * Note : le parser vocal du POC mode dictée (`voice-poc.html`) gère en plus
 * les fractions iOS ("12 1/2") et les nombres prononcés ("douze et demi").
 * Cette version simple suffit pour la saisie clavier directe (#41).
 */

export type GradeParseResult =
  | { value: number; absent: false }
  | { value: null; absent: true }
  | { value: null; absent: false; error?: string }

const ABSENT_KEYWORDS = ["absent", "absente", "non noté", "non note", "non rendu", "rien", "pas noté", "pas note"]

export function parseGradeInput(input: string): GradeParseResult {
  const trimmed = input.trim()

  // Vide = pas de saisie (pas une erreur)
  if (!trimmed) {
    return { value: null, absent: false }
  }

  // Mots-clés "absent"
  const lower = trimmed.toLowerCase()
  for (const kw of ABSENT_KEYWORDS) {
    if (lower === kw) {
      return { value: null, absent: true }
    }
  }

  // Virgule française → point + collapse spaces autour des séparateurs
  const normalized = trimmed.replace(/[,.\s]+/g, ".").replace(/^\.|\.$/g, "")

  const num = parseFloat(normalized)
  if (isNaN(num)) {
    return { value: null, absent: false, error: "Format invalide" }
  }
  if (num < 0 || num > 20) {
    return { value: null, absent: false, error: "Hors borne [0-20]" }
  }
  // Round to 2 decimals max (4.05, pas 4.0500001)
  return { value: Math.round(num * 100) / 100, absent: false }
}

/**
 * Catégorie sémantique d'une note /20 — pour color-coding + icône + texte.
 * WCAG-compliant : on ne se repose JAMAIS sur la couleur seule.
 */
export type GradeCategory = "difficulte" | "moyen" | "bon" | "absent" | "non_saisi"

export function categorizeGrade(value: number | null, status: string): GradeCategory {
  if (value === null && status === "entered") return "absent"
  if (value === null) return "non_saisi"
  if (value < 10) return "difficulte"
  if (value < 14) return "moyen"
  return "bon"
}

export function gradeCategoryLabel(category: GradeCategory): string {
  switch (category) {
    case "difficulte":
      return "En difficulté"
    case "moyen":
      return "Passable"
    case "bon":
      return "Bon"
    case "absent":
      return "Absent"
    case "non_saisi":
      return "Non saisi"
  }
}

/**
 * Calcule la moyenne d'un set de notes (ignore les null).
 * Retourne null si aucune note saisie.
 */
export function computeAverage(values: Iterable<number | null>): number | null {
  const arr = Array.from(values).filter((v): v is number => v !== null)
  if (arr.length === 0) return null
  const sum = arr.reduce((a, b) => a + b, 0)
  return Math.round((sum / arr.length) * 100) / 100
}
