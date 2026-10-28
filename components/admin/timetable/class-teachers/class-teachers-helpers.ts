import type {
  ClassSubjectTeacherAssignment,
  ClassSubjectTeacherItem,
} from "@/lib/contracts/class-subject-teachers"

export type TeacherDraft = Record<number, number | null>

/** Brouillon initial : une entrée par matière, l'enseignant que le serveur retient. */
export function buildDraft(items: ClassSubjectTeacherItem[]): TeacherDraft {
  const draft: TeacherDraft = {}
  for (const item of items) draft[item.subject_id] = item.resolved_teacher_id
  return draft
}

/** Seules les lignes qui diffèrent de ce que le serveur retient sont envoyées. */
export function changedAssignments(
  items: ClassSubjectTeacherItem[],
  draft: TeacherDraft,
): ClassSubjectTeacherAssignment[] {
  return items
    .filter((item) => (draft[item.subject_id] ?? null) !== item.resolved_teacher_id)
    .map((item) => ({
      subject_id: item.subject_id,
      teacher_id: draft[item.subject_id] ?? null,
    }))
}

/** Matières sans enseignant dans le brouillon courant. */
export function countMissing(items: ClassSubjectTeacherItem[], draft: TeacherDraft): number {
  return items.filter((item) => (draft[item.subject_id] ?? null) === null).length
}
