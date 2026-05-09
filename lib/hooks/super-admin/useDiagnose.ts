"use client"

import { useQuery } from "@tanstack/react-query"
import { diagnoseApi } from "@/lib/api/super-admin/diagnose"

export const diagnoseKeys = {
  platform: ["super-admin", "diagnose", "platform"] as const,
}

export function usePlatformHealth(refetchIntervalMs = 30_000) {
  return useQuery({
    queryKey: diagnoseKeys.platform,
    queryFn: () => diagnoseApi.platform(),
    refetchInterval: refetchIntervalMs,
  })
}
