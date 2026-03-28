"use client"

import { useQuery } from "@tanstack/react-query"
import { academicYearsApi } from "@/lib/api/academic-years"

export function useAcademicYears() {
  return useQuery({
    queryKey: ["academic-years"],
    queryFn: () => academicYearsApi.list(),
    staleTime: 1000 * 60 * 30, // 30 min — données rarement modifiées
  })
}
