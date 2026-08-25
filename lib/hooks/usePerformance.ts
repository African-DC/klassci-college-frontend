"use client"

import { useQuery } from "@tanstack/react-query"
import { performanceApi } from "@/lib/api/performance"

export const performanceKeys = {
  all: ["performance"] as const,
  teachers: () => ["performance", "teachers"] as const,
  staff: () => ["performance", "staff"] as const,
  me: () => ["performance", "me"] as const,
}

export function useTeachersPerformance() {
  return useQuery({
    queryKey: performanceKeys.teachers(),
    queryFn: () => performanceApi.getTeachers(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useStaffActivity() {
  return useQuery({
    queryKey: performanceKeys.staff(),
    queryFn: () => performanceApi.getStaff(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useMyPerformance() {
  return useQuery({
    queryKey: performanceKeys.me(),
    queryFn: () => performanceApi.getMyPerformance(),
    staleTime: 1000 * 60 * 2,
  })
}
