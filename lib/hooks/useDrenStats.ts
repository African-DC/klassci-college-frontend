"use client"

import { useQuery } from "@tanstack/react-query"
import { drenApi } from "@/lib/api/dren"

export const drenKeys = {
  all: ["dren"] as const,
  stats: (academicYearId: number) => ["dren", "stats", academicYearId] as const,
}

// Récupérer les statistiques DREN pour une année académique
export function useDrenStats(academicYearId: number | undefined) {
  return useQuery({
    queryKey: academicYearId ? drenKeys.stats(academicYearId) : ["dren", "stats", "none"],
    queryFn: () => drenApi.getStats(academicYearId as number),
    enabled: !!academicYearId,
    staleTime: 1000 * 60 * 10,
  })
}
