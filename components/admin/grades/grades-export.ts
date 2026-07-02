import type { Evaluation } from "@/lib/contracts/grade"
import type { SchoolSettings } from "@/lib/contracts/settings"
import type { ExportPayload } from "@/lib/export"
import { brandingFromSettings } from "@/lib/export/branding"

const TYPE_LABELS: Record<string, string> = {
  controle: "Contrôle",
  devoir: "Devoir",
  examen: "Examen",
  oral: "Oral",
}

function isOverdue(e: Evaluation): boolean {
  const daysAgo = (Date.now() - new Date(e.date).getTime()) / (1000 * 60 * 60 * 24)
  return daysAgo > 3 && e.graded_students < e.total_students
}

function isDone(e: Evaluation): boolean {
  return e.total_students > 0 && e.graded_students === e.total_students
}

function statusLabel(e: Evaluation): string {
  if (isOverdue(e)) return "En retard"
  if (isDone(e)) return "Complète"
  return "En cours"
}

interface GradesExportArgs {
  evaluations: Evaluation[]
  settings: SchoolSettings | undefined
  /** Résumé lisible du contexte (classe, matière, trimestre, vue). */
  filters?: string
}

/**
 * Construit la charge utile d'export du suivi des évaluations tel qu'affiché
 * (classe sélectionnée, filtres appliqués). Colonnes calquées sur le tableau
 * de supervision : évaluation, type, matière, date, coefficient, saisies,
 * statut.
 */
export function buildGradesExportPayload({
  evaluations,
  settings,
  filters,
}: GradesExportArgs): ExportPayload {
  return {
    branding: brandingFromSettings(settings),
    meta: {
      title: "Suivi des évaluations",
      subtitle: `${evaluations.length} évaluation(s) affichée(s)`,
      filters,
      date: new Date().toLocaleDateString("fr-FR"),
    },
    columns: [
      { key: "evaluation", header: "Évaluation" },
      { key: "type", header: "Type" },
      { key: "matiere", header: "Matière" },
      { key: "date", header: "Date", format: "date" },
      { key: "coefficient", header: "Coeff.", format: "number" },
      { key: "saisies", header: "Saisies" },
      { key: "statut", header: "Statut" },
    ],
    rows: evaluations.map((e) => ({
      evaluation: e.title,
      type: TYPE_LABELS[e.type] ?? e.type,
      matiere: e.subject_name,
      date: e.date,
      coefficient: e.coefficient,
      saisies: `${e.graded_students}/${e.total_students}`,
      statut: statusLabel(e),
    })),
  }
}
