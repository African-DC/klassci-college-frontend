import { apiFetch } from "@/lib/api/client"
import { ClassRosterDataSchema, type ClassRosterData, type ClassRosterFilters } from "@/lib/contracts/class-roster"

export function rosterFilterQuery(filters: ClassRosterFilters = {}): string {
  const params = new URLSearchParams()
  if (filters.genre) params.set("genre", filters.genre)
  if (filters.age_min !== undefined) params.set("age_min", String(filters.age_min))
  if (filters.age_max !== undefined) params.set("age_max", String(filters.age_max))
  for (const n of [...new Set(filters.nationalities ?? [])].sort()) params.append("nationalities", n)
  for (const s of [...new Set(filters.assignment_statuses ?? [])].sort()) params.append("assignment_statuses", s)
  if (filters.is_repeater !== undefined) params.set("is_repeater", String(filters.is_repeater))
  if (filters.is_new_student !== undefined) params.set("is_new_student", String(filters.is_new_student))
  const q = params.toString()
  return q ? `?${q}` : ""
}
export function fetchClassRosterData(classId: number, filters: ClassRosterFilters = {}): Promise<ClassRosterData> {
  return apiFetch(`/admin/classes/${classId}/roster/data${rosterFilterQuery(filters)}`, {
    schema: ClassRosterDataSchema,
  })
}
