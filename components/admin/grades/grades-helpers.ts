import type { Evaluation } from "@/lib/contracts/grade"

export const TYPE_LABELS: Record<string, string> = {
  controle: "Contrôle",
  devoir: "Devoir",
  examen: "Examen",
  oral: "Oral",
}

export type FilterTab = "all" | "todo" | "overdue" | "done"

export const TAB_LABELS: Record<FilterTab, string> = {
  all: "Toutes",
  todo: "À saisir",
  overdue: "En retard",
  done: "Terminées",
}

export function isOverdue(evaluation: Evaluation): boolean {
  const daysAgo = (Date.now() - new Date(evaluation.date).getTime()) / (1000 * 60 * 60 * 24)
  return daysAgo > 3 && evaluation.graded_students < evaluation.total_students
}

export function isDone(evaluation: Evaluation): boolean {
  return evaluation.total_students > 0 && evaluation.graded_students === evaluation.total_students
}
