import { SubjectSchema } from "@/lib/contracts/subject"
import type { Subject, SubjectCreate, SubjectUpdate } from "@/lib/contracts/subject"
import { createCrudApi } from "./createCrudApi"
import { apiFetch } from "./client"

export const subjectsApi = createCrudApi<Subject, SubjectCreate, SubjectUpdate>(
  "/admin/subjects",
  SubjectSchema,
)

export async function duplicateSubject(data: {
  subject_id: number
  level_id: number
  series_id?: number | null
}): Promise<Subject> {
  const res = await apiFetch<unknown>("/admin/subjects/duplicate", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return SubjectSchema.parse(res)
}
