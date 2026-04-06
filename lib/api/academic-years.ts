import { z } from "zod"
import { apiFetch, safeValidate } from "./client"

export const AcademicYearSchema = z.object({
  id: z.number(),
  label: z.string(),
})

export type AcademicYear = z.infer<typeof AcademicYearSchema>

const ArraySchema = z.array(AcademicYearSchema)

export const academicYearsApi = {
  list: async (): Promise<AcademicYear[]> => {
    const data = await apiFetch<unknown>("/academic-years")
    // L'API peut retourner un tableau ou un objet paginé
    const raw = Array.isArray(data) ? data : (data as { data: unknown[] }).data ?? data
    return safeValidate(ArraySchema, raw, "/academic-years")
  },
}
