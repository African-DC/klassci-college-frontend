import type {
  ClassSubjectTeacherAssignment,
  ClassSubjectTeacherItem,
} from "@/lib/contracts/class-subject-teachers"

/** Enseignant pré-sélectionné : celui qui est retenu, sinon l'unique choix possible. */
export function teacherFromSource(item: ClassSubjectTeacherItem): number | null {
  if (item.assigned_teacher_id !== null) return item.assigned_teacher_id
  if (item.eligible_teachers.length === 1) return item.eligible_teachers[0].id
  return null
}

/** Brouillon initial : une entrée par matière, valeur retenue ou pré-sélection. */
export function buildDraft(items: ClassSubjectTeacherItem[]): Record<number, number | null> {
  const draft: Record<number, number | null> = {}
  for (const item of items) draft[item.subject_id] = teacherFromSource(item)
  return draft
}

/** Seules les lignes qui diffèrent de ce que le serveur retient sont envoyées. */
export function changedAssignments(
  items: ClassSubjectTeacherItem[],
  draft: Record<number, number | null>,
): ClassSubjectTeacherAssignment[] {
  return items
    .filter((item) => (draft[item.subject_id] ?? null) !== item.assigned_teacher_id)
    .map((item) => ({
      subject_id: item.subject_id,
      teacher_id: draft[item.subject_id] ?? null,
    }))
}

/**
 * Message lisible tiré d'une erreur API. Le détail FastAPI est une chaîne en
 * français quand le backend refuse ; on ne le déduit pas d'un type précis.
 */
export function messageFromError(err: unknown): string {
  if (err && typeof err === "object" && "detail" in err) {
    const detail = (err as { detail: unknown }).detail
    if (typeof detail === "string" && detail.length > 0) return detail
  }
  if (err instanceof Error && err.message) return err.message
  return "Erreur inconnue"
}
