"use client"

import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api/client"

// Types simples pour les données de référence (classes, années académiques)
interface ClassItem {
  id: number
  name: string
}

interface AcademicYear {
  id: number
  label: string
}

export const referenceKeys = {
  classes: ["classes"] as const,
  academicYears: ["academic-years"] as const,
}

export function useClasses() {
  return useQuery({
    queryKey: referenceKeys.classes,
    queryFn: async () => {
      const json = await apiFetch<{ data?: ClassItem[] } | ClassItem[]>("/classes")
      return Array.isArray(json) ? json : (json.data ?? [])
    },
    staleTime: 1000 * 60 * 10,
  })
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
