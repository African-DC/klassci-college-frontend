import { SubjectSchema, SubjectSlotCountsSchema, type SubjectSlotCounts } from "@/lib/contracts/subject"
import type { Subject, SubjectCreate, SubjectUpdate } from "@/lib/contracts/subject"
import { createCrudApi } from "./createCrudApi"
import { apiFetch, safeValidate } from "./client"

export const subjectsApi = createCrudApi<Subject, SubjectCreate, SubjectUpdate>(
  "/admin/subjects",
  SubjectSchema,
)

export async function duplicateSubject(data: {
  subject_id: number
  level_id: number
  series_id?: number | null
  coefficient?: number
  hours_per_week?: number
  teacher_ids?: number[]
}): Promise<Subject> {
  const json = await apiFetch<unknown>("/admin/subjects/duplicate", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return safeValidate(SubjectSchema, json, "POST /admin/subjects/duplicate")
}

/** Créneaux de l'emploi du temps par enseignant pour une matière. */
export async function getSubjectSlotCounts(id: number): Promise<SubjectSlotCounts> {
  const json = await apiFetch<unknown>(`/admin/subjects/${id}/slot-counts`)
  return safeValidate(SubjectSlotCountsSchema, json, `GET /admin/subjects/${id}/slot-counts`)
}
