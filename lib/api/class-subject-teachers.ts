import { apiFetch, safeValidate } from "./client"
import {
  ClassSubjectTeachersSchema,
  type ClassSubjectTeacherAssignment,
  type ClassSubjectTeachers,
} from "@/lib/contracts/class-subject-teachers"

// La réponse porte `items` au premier niveau : elle n'est pas dépliée.
export const classSubjectTeachersApi = {
  get: async (classId: number): Promise<ClassSubjectTeachers> => {
    const json = await apiFetch<unknown>(`/timetable/classes/${classId}/subject-teachers`)
    return safeValidate(ClassSubjectTeachersSchema, json, `GET /timetable/classes/${classId}/subject-teachers`)
  },

  save: async (
    classId: number,
    assignments: ClassSubjectTeacherAssignment[],
  ): Promise<ClassSubjectTeachers> => {
    const json = await apiFetch<unknown>(`/timetable/classes/${classId}/subject-teachers`, {
      method: "PUT",
      body: JSON.stringify({ assignments }),
    })
    return safeValidate(ClassSubjectTeachersSchema, json, `PUT /timetable/classes/${classId}/subject-teachers`)
  },
}
