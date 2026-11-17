"use client"

import { useQuery } from "@tanstack/react-query"
import { dashboardApi } from "@/lib/api/dashboard"

export const dashboardKeys = {
  stats: ["dashboard", "stats"] as const,
  activity: ["dashboard", "activity"] as const,
  summary: ["dashboard", "summary"] as const,
}

/**
 * Agrégats KPI serveur (corrects quelle que soit la volumétrie). Partagé entre
 * toutes les pages admin via une seule requête mise en cache.
 */
export function useAdminSummary(academicYearId?: number) {
  return useQuery({
    // Clé préfixée par `summary` : les invalidations existantes la couvrent.
    queryKey: [...dashboardKeys.summary, academicYearId ?? "current"] as const,
    queryFn: () => dashboardApi.summary(academicYearId),
    staleTime: 1000 * 60 * 2,
    retry: 1,
  })
}

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats,
    queryFn: dashboardApi.stats,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  })
}

export function useDashboardActivity() {
  return useQuery({
    queryKey: dashboardKeys.activity,
    queryFn: dashboardApi.activity,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  })
}
