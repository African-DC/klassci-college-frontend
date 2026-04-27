/**
 * Parser vocal pour notes /20 — port TypeScript du POC `static/voice-poc.html`.
 *
 * Gère 2 dialectes ASR (validés sur Chrome Android + iOS Safari, 2026-04-26) :
 *
 * - Chrome Android : transcrit "douze virgule cinq" → "douze virgule cinq" (mots)
 * - iOS Safari    : transcrit "douze et demi" → "12 1/2" (fraction littérale)
 *
 * Phrasings acceptés :
 *   "douze"                  → 12
 *   "douze virgule cinq"     → 12.5
 *   "douze point cinq"       → 12.5
 *   "douze sur vingt"        → 12  (suffixe ignoré)
 *   "douze et demi"          → 12.5  (Chrome) ou via "12 1/2" (iOS)
 *   "12,5" / "12.5"          → 12.5
 *   "12 1/2" / "12 1/4"      → 12.5 / 12.25
 *   "absent" / "non rendu"   → null absent
 *
 * Hors borne [0, 20] → erreur, valeur null.
 */

export type VoiceGradeResult =
  | { value: number; absent: false; label: string }
  | { value: null; absent: true; label: string }
  | { value: null; absent: false; error: string }

const FRENCH_NUMBERS: Record<string, number> = {
  "zéro": 0, "zero": 0,
  "un": 1, "une": 1,
  "deux": 2,
  "trois": 3,
  "quatre": 4,
  "cinq": 5,
  "six": 6,
  "sept": 7,
  "huit": 8,
  "neuf": 9,
  "dix": 10,
  "onze": 11,
  "douze": 12,
  "treize": 13,
  "quatorze": 14,
  "quinze": 15,
  "seize": 16,
  "dix-sept": 17, "dix sept": 17,
  "dix-huit": 18, "dix huit": 18,
  "dix-neuf": 19, "dix neuf": 19,
  "vingt": 20,
}

const ABSENT_KEYWORDS = ["absent", "absente", "non noté", "non note", "non rendu", "rien", "pas noté", "pas note"]

/**
 * Mots-clés de navigation/commande hors notation.
 * Détectés AVANT le parsing chiffre pour ne pas confondre "deux" (=2) et "suivant".
 */
export type VoiceCommand = "next" | "prev" | "absent" | "pause" | "exit" | "recap"

const COMMAND_KEYWORDS: Record<VoiceCommand, string[]> = {
  next: ["suivant", "suivante", "valider", "ok", "valide"],
  prev: ["précédent", "precedent", "précédente", "retour", "annuler"],
  absent: ["absent", "absente", "non rendu", "non noté"],
  pause: ["pause", "stop", "arrête", "arrete"],
  exit: ["sortir", "fermer", "quitter", "terminer"],
  recap: ["récap", "recap", "récapitulatif", "fin", "résumé", "resume"],
}

/**
 * Détecte si la transcription est une commande de navigation.
 * Renvoie la commande détectée ou null. Vérifie les commandes courtes en
 * priorité (ex: "absent" est aussi un VoiceCommand pour ne pas chercher un
 * chiffre dans "absent").
 */
export function detectCommand(transcript: string): VoiceCommand | null {
  const t = transcript.toLowerCase().trim()
  if (!t) return null
  for (const [cmd, keywords] of Object.entries(COMMAND_KEYWORDS)) {
    for (const kw of keywords) {
      if (t === kw || t.startsWith(`${kw} `) || t.endsWith(` ${kw}`)) {
        return cmd as VoiceCommand
      }
    }
  }
  return null
}

/**
 * Parse une transcription vocale en note /20.
 * Renvoie un VoiceGradeResult discriminé.
 */
export function parseSpokenGrade(transcript: string): VoiceGradeResult | null {
  if (!transcript) return null

  // Normalisation : ponctuation à virer SAUF virgules/points (séparateurs décimaux).
  let text = transcript
    .toLowerCase()
    .trim()
    .replace(/[!?;:]/g, "")
    .replace(/sur vingt/g, "")
    .replace(/^la note (est |de )?/, "")
    .replace(/^c'est /, "")
    .trim()

  // iOS Safari ASR : "X et demi" est parfois transcrit en fraction littérale "X 1/2".
  // Sans cette normalisation, "12 1/2" matcherait "12 1" → 12.1 (bug observé 2026-04-26).
  text = text.replace(/(\d+)\s*1\/4\b/g, "$1.25")
  text = text.replace(/(\d+)\s*3\/4\b/g, "$1.75")
  text = text.replace(/(\d+)\s*1\/2\b/g, "$1.5")

  // Mots-clés "absent" — gérés ici aussi pour fallback si detectCommand n'est pas appelé.
  for (const kw of ABSENT_KEYWORDS) {
    if (text.includes(kw)) {
      return { value: null, absent: true, label: "Absent" }
    }
  }

  // Chiffres directs avec séparateur décimal : "12,5" / "12.5"
  const direct = text.match(/(\d{1,2})[,.](\d{1,2})\b/)
  if (direct) {
    const v = parseFloat(`${direct[1]}.${direct[2]}`)
    if (v >= 0 && v <= 20) return { value: v, absent: false, label: formatGrade(v) }
    return { value: null, absent: false, error: `Hors borne (${v})` }
  }

  // "12 5" (espace au lieu de virgule, phrasing rare mais Chrome Android le produit parfois)
  const spaceSep = text.match(/^(\d{1,2})\s+(\d{1,2})\s*$/)
  if (spaceSep) {
    const v = parseFloat(`${spaceSep[1]}.${spaceSep[2]}`)
    if (v >= 0 && v <= 20) return { value: v, absent: false, label: formatGrade(v) }
    return { value: null, absent: false, error: `Hors borne (${v})` }
  }

  // Entier seul
  const intOnly = text.match(/^(\d{1,2})\.?$/)
  if (intOnly) {
    const v = parseInt(intOnly[1], 10)
    if (v >= 0 && v <= 20) return { value: v, absent: false, label: formatGrade(v) }
    return { value: null, absent: false, error: `Hors borne (${v})` }
  }

  // Forme verbalisée : "douze virgule cinq" / "douze et demi" / "douze"
  const normalized = text
    .replace(/\b(virgule|point)\b/g, ".")
    .replace(/\bet demi(e)?\b/g, ".5")

  const tokens = normalized.split(/[\s.]+/).filter(Boolean)
  let intPart: number | null = null
  let decPart: number | null = null

  for (const tok of tokens) {
    if (tok in FRENCH_NUMBERS) {
      const num = FRENCH_NUMBERS[tok]
      if (intPart === null) intPart = num
      else if (decPart === null && num >= 0 && num <= 9) decPart = num
    } else if (/^\d+$/.test(tok)) {
      const num = parseInt(tok, 10)
      if (intPart === null) intPart = num
      else if (decPart === null && num >= 0 && num <= 9) decPart = num
    }
  }

  // Pattern implicite "X Y" en mots ("douze cinq" → 12.5)
  if (intPart !== null && decPart === null) {
    for (let i = 0; i < tokens.length - 1; i++) {
      const a = FRENCH_NUMBERS[tokens[i]]
      const b = FRENCH_NUMBERS[tokens[i + 1]]
      if (a !== undefined && b !== undefined && a >= 0 && a <= 20 && b >= 0 && b <= 9) {
        intPart = a
        decPart = b
        break
      }
    }
  }

  if (intPart === null) return null

  const v = decPart !== null ? intPart + decPart / 10 : intPart
  if (v < 0 || v > 20) return { value: null, absent: false, error: `Hors borne (${v})` }
  return { value: Math.round(v * 100) / 100, absent: false, label: formatGrade(v) }
}

function formatGrade(v: number): string {
  // 12 → "12", 12.5 → "12,5" (FR convention)
  return Number.isInteger(v) ? v.toString() : v.toString().replace(".", ",")
}
