import { AlertTriangle, CheckCircle2, Hourglass } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { TeacherUpcomingEval } from "@/lib/contracts/teacher-portal"

export const TYPE_LABELS: Record<string, string> = {
  controle: "Contrôle",
  devoir: "Devoir",
  examen: "Examen",
  oral: "Oral",
}

export function isOverdue(evalDate: string, gradedStudents: number, totalStudents: number): boolean {
  const daysAgo = (Date.now() - new Date(evalDate).getTime()) / (1000 * 60 * 60 * 24)
  return daysAgo > 3 && gradedStudents < totalStudents
}

export function isDone(gradedStudents: number, totalStudents: number): boolean {
  return totalStudents > 0 && gradedStudents === totalStudents
}

/** État d'une évaluation, partagé entre la ligne de tableau et la carte mobile. */
export function evaluationState(evaluation: TeacherUpcomingEval) {
  const overdue = isOverdue(evaluation.date, evaluation.graded_students, evaluation.total_students)
  const complete = isDone(evaluation.graded_students, evaluation.total_students)
  const progressPct =
    evaluation.total_students > 0
      ? (evaluation.graded_students / evaluation.total_students) * 100
      : 0
  return { overdue, complete, progressPct }
}

export function EvaluationProgress({ evaluation }: { evaluation: TeacherUpcomingEval }) {
  const { overdue, complete, progressPct } = evaluationState(evaluation)
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            complete ? "bg-emerald-500" : overdue ? "bg-destructive" : "bg-primary",
          )}
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">
        {evaluation.graded_students}/{evaluation.total_students}
      </span>
    </div>
  )
}

export function EvaluationStatusBadge({ evaluation }: { evaluation: TeacherUpcomingEval }) {
  const { overdue, complete } = evaluationState(evaluation)
  if (overdue) {
    return (
      <Badge variant="destructive" className="gap-1 text-[10px]">
        <AlertTriangle className="h-3 w-3" />
        En retard
      </Badge>
    )
  }
  if (complete) {
    return (
      <Badge className="gap-1 bg-emerald-100 text-[10px] text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300">
        <CheckCircle2 className="h-3 w-3" />
        Complète
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="gap-1 text-[10px]">
      <Hourglass className="h-3 w-3" />
      En cours
    </Badge>
  )
}
