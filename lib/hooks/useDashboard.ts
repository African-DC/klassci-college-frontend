"use client"

import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { dashboardApi } from "@/lib/api/dashboard"

export const dashboardKeys = {
  stats: ["dashboard", "stats"] as const,
}

export function useDashboardStats() {
  const { data: session } = useSession()

  return useQuery({
    queryKey: dashboardKeys.stats,
    queryFn: () => dashboardApi.stats(session?.accessToken),
    enabled: !!session?.accessToken,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  })
}
