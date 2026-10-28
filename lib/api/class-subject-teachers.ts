import { apiFetch, safeValidate } from "./client"
import {
  ClassSubjectTeachersSchema,
  ClassSubjectTeachersSaveSchema,
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
    const body = ClassSubjectTeachersSaveSchema.parse({ assignments })
    const json = await apiFetch<unknown>(`/timetable/classes/${classId}/subject-teachers`, {
      method: "PUT",
      body: JSON.stringify(body),
    })
    return safeValidate(ClassSubjectTeachersSchema, json, `PUT /timetable/classes/${classId}/subject-teachers`)
  },
}
