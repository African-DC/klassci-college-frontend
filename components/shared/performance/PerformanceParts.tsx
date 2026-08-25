import { cn } from "@/lib/utils"
import type { PerformanceAxis } from "@/lib/contracts/performance"
import { axisDescription, formatScore, ratingConfig, scoreColorClass } from "@/lib/utils/performance"

// Libellés FR des compteurs bruts de chaque axe (justification du score).
const DETAIL_LABELS: Record<string, string> = {
  total_sessions: "Séances pointées",
  present: "Présent",
  late: "Retards",
  absent_excused: "Absences justifiées",
  absent_unexcused: "Absences non justifiées",
  late_minutes: "Minutes de retard",
  pending_validation: "En attente de validation",
  total_evaluations: "Évaluations créées",
  fully_graded: "Entièrement notées",
  entered_grades: "Notes saisies",
  expected_grades: "Notes attendues",
  pending_grades: "Notes restantes",
  appels_taken: "Appels effectués",
  expected_sessions: "Séances planifiées",
}

// Ordre d'affichage préféré par axe (les clés absentes sont ignorées).
const DETAIL_ORDER: Record<string, string[]> = {
  assiduite: [
    "total_sessions",
    "present",
    "late",
    "absent_excused",
    "absent_unexcused",
    "late_minutes",
    "pending_validation",
  ],
  notes: ["total_evaluations", "fully_graded", "entered_grades", "expected_grades", "pending_grades"],
  appel: ["appels_taken", "expected_sessions"],
}

/** Pastille de notation (Excellent / Bon / À améliorer / Données insuffisantes). */
export function RatingPill({ rating, className }: { rating: string; className?: string }) {
  const cfg = ratingConfig(rating)
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        cfg.pillClass,
        className,
      )}
    >
      {cfg.label}
    </span>
  )
}

function orderedDetail(axis: PerformanceAxis): [string, number][] {
  const order = DETAIL_ORDER[axis.key] ?? Object.keys(axis.detail)
  const out: [string, number][] = []
  for (const key of order) {
    const raw = axis.detail[key]
    if (typeof raw === "number" && DETAIL_LABELS[key]) {
      out.push([key, raw])
    }
  }
  return out
}

/** Carte d'un axe : sous-score, description de ce qui est mesuré, et compteurs. */
export function PerformanceAxisCard({ axis }: { axis: PerformanceAxis }) {
  const weightPct = Math.round(axis.weight * 100)
  const details = orderedDetail(axis)

  return (
    <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{axis.label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {axisDescription(axis.key)} · pèse {weightPct}%
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className={cn("text-2xl font-bold leading-none tabular-nums", scoreColorClass(axis.score))}>
            {formatScore(axis.score)}
          </p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">/ 100</p>
        </div>
      </div>

      {axis.sufficient && details.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground tabular-nums">
          {details.map(([key, value]) => (
            <span key={key}>
              <span className="font-medium text-foreground">{value}</span> {DETAIL_LABELS[key]}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          Données insuffisantes pour noter cet axe pour le moment.
        </p>
      )}
    </div>
  )
}
