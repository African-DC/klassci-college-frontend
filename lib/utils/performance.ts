// Helpers d'affichage partagés entre la vue admin et la vue « Ma performance ».

export interface RatingConfig {
  label: string
  // Classes Tailwind via tokens/sémantique (dark-safe)
  pillClass: string
  ringColor: string // hex pour CircularProgress
}

export const RATING_CONFIG: Record<string, RatingConfig> = {
  excellent: {
    label: "Excellent",
    pillClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    ringColor: "#10b981",
  },
  bon: {
    label: "Bon",
    pillClass: "bg-primary/10 text-primary",
    ringColor: "#0453cb",
  },
  a_ameliorer: {
    label: "À améliorer",
    pillClass: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    ringColor: "#f59e0b",
  },
  insuffisant_donnees: {
    label: "Données insuffisantes",
    pillClass: "bg-muted text-muted-foreground",
    ringColor: "#94a3b8",
  },
}

export function ratingConfig(rating: string): RatingConfig {
  return RATING_CONFIG[rating] ?? RATING_CONFIG.insuffisant_donnees
}

// Ce que mesure chaque axe (pour la vue enseignant + tooltip admin).
export const AXIS_DESCRIPTION: Record<string, string> = {
  assiduite: "Votre présence aux séances pointées (présent, retard, absence).",
  notes: "Part des notes saisies sur les évaluations que vous avez créées.",
  appel: "Part des séances planifiées où l'appel des élèves a été fait.",
}

export function axisDescription(key: string): string {
  return AXIS_DESCRIPTION[key] ?? ""
}

// Formate un score 0-100 : « 82 » ou « — » si non calculable.
export function formatScore(score: number | null): string {
  if (score === null || score === undefined) return "—"
  return Number.isInteger(score) ? String(score) : score.toFixed(1)
}

// Couleur sémantique d'un score (par seuils), alignée sur CircularProgress.
export function scoreColorClass(score: number | null): string {
  if (score === null || score === undefined) return "text-muted-foreground"
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400"
  if (score >= 60) return "text-primary"
  return "text-amber-600 dark:text-amber-400"
}
