"use client"

import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api/client"

// Types simples pour les données de référence
interface AcademicYear {
  id: number
  label: string
}

export const referenceKeys = {
  academicYears: ["academic-years"] as const,
}

export function useAcademicYears() {
  return useQuery({
    queryKey: referenceKeys.academicYears,
    queryFn: async () => {
      const json = await apiFetch<{ data?: AcademicYear[] } | AcademicYear[]>("/academic-years")
      return Array.isArray(json) ? json : (json.data ?? [])
    },
    staleTime: 1000 * 60 * 10,
  })
}
