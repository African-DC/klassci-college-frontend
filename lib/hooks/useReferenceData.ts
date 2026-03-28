"use client"

import { z } from "zod"
import { useQuery } from "@tanstack/react-query"
import { apiFetch, safeValidate } from "@/lib/api/client"

// Schemas Zod pour les données de référence
const ClassItemSchema = z.object({ id: z.number(), name: z.string() })
const AcademicYearSchema = z.object({ id: z.number(), label: z.string() })
const ClassItemArraySchema = z.array(ClassItemSchema)
const AcademicYearArraySchema = z.array(AcademicYearSchema)

export type ClassItem = z.infer<typeof ClassItemSchema>
export type AcademicYear = z.infer<typeof AcademicYearSchema>

export const referenceKeys = {
  classes: ["classes"] as const,
  academicYears: ["academic-years"] as const,
}

export function useClasses() {
  return useQuery({
    queryKey: referenceKeys.classes,
    queryFn: async () => {
      const json = await apiFetch<{ data?: ClassItem[] } | ClassItem[]>("/classes")
      const arr = Array.isArray(json) ? json : (json.data ?? [])
      return safeValidate(ClassItemArraySchema, arr, "GET /classes")
    },
    staleTime: 1000 * 60 * 10,
  })
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
