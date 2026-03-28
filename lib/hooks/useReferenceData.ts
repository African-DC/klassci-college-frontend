"use client"

import { z } from "zod"
import { useQuery } from "@tanstack/react-query"
import { apiFetch, safeValidate } from "@/lib/api/client"

// Schema Zod pour les années académiques
const AcademicYearSchema = z.object({
  id: z.number(),
  label: z.string(),
})
const AcademicYearArraySchema = z.array(AcademicYearSchema)

export type AcademicYear = z.infer<typeof AcademicYearSchema>

export const referenceKeys = {
  academicYears: ["academic-years"] as const,
}

export function useAcademicYears() {
  return useQuery({
    queryKey: referenceKeys.academicYears,
    queryFn: async () => {
      const json = await apiFetch<{ data?: AcademicYear[] } | AcademicYear[]>("/academic-years")
      const arr = Array.isArray(json) ? json : (json.data ?? [])
      return safeValidate(AcademicYearArraySchema, arr, "GET /academic-years")
    },
    staleTime: 1000 * 60 * 10,
  })
}
