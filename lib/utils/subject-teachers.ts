import type { Subject, SubjectTeacher } from "@/lib/contracts/subject"

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
