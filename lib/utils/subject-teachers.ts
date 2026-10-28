import type { Subject } from "@/lib/contracts/subject"

export interface SubjectTeacher {
  id: number
  full_name: string
}

/**
 * Enseignants d'une matière, ordonnés (le premier est le principal).
 * Repli sur `teacher_id` / `teacher_name` quand la liste `teachers` est absente.
 */
export function subjectTeachers(
  subject: Pick<Subject, "teachers" | "teacher_id" | "teacher_name">,
): SubjectTeacher[] {
  if (subject.teachers !== undefined) return subject.teachers
  if (subject.teacher_id && subject.teacher_name) {
    return [{ id: subject.teacher_id, full_name: subject.teacher_name }]
  }
  return []
}

export function subjectTeacherIds(subject: Pick<Subject, "teachers" | "teacher_id" | "teacher_name">): number[] {
  return subjectTeachers(subject).map((t) => t.id)
}

export function subjectTeacherNames(subject: Pick<Subject, "teachers" | "teacher_id" | "teacher_name">): string[] {
  return subjectTeachers(subject).map((t) => t.full_name)
}
