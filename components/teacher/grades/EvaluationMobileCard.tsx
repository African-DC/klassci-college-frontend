import Link from "next/link"
import type { Route } from "next"
import { Edit3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { TeacherUpcomingEval } from "@/lib/contracts/teacher-portal"
import {
  EvaluationProgress,
  EvaluationStatusBadge,
  TYPE_LABELS,
  evaluationState,
} from "./evaluation-status"

/**
 * Une évaluation sur téléphone : ce que l'enseignant doit voir avant de toucher
 * « Saisir », sans faire défiler la page de côté. Le tableau de 8 colonnes,
 * lui, débordait de 170 px à 375 px de large (recette du 2026-11-05).
 */
export function EvaluationMobileCard({ evaluation }: { evaluation: TeacherUpcomingEval }) {
  const { overdue, complete } = evaluationState(evaluation)
  const date = new Date(evaluation.date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  })

  return (
    <li
      className={cn(
        "rounded-xl border bg-card p-4",
        overdue && "border-destructive/40 bg-destructive/5",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{evaluation.title}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {TYPE_LABELS[evaluation.type] ?? evaluation.type} · {evaluation.class_name} ·{" "}
            {evaluation.subject_name} · {date}
          </p>
        </div>
        <EvaluationStatusBadge evaluation={evaluation} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <EvaluationProgress evaluation={evaluation} />
        <Button asChild size="sm" variant={complete ? "outline" : "default"} className="h-11 px-4">
          <Link href={`/teacher/grades/${evaluation.class_id}/${evaluation.id}` as Route}>
            <Edit3 className="mr-1 h-4 w-4" />
            {complete ? "Réviser" : "Saisir"}
          </Link>
        </Button>
      </div>
    </li>
  )
}
