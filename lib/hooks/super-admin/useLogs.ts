"use client"

import { useQuery } from "@tanstack/react-query"
import { logsApi } from "@/lib/api/super-admin/logs"

export const logsKeys = {
  read: (service: string, lines: number) =>
    ["super-admin", "logs", service, lines] as const,
}

export function useLogs(service: string, lines: number, enabled = true) {
  return useQuery({
    queryKey: logsKeys.read(service, lines),
    queryFn: () => logsApi.read(service, lines),
    enabled,
    refetchInterval: enabled ? 5_000 : false,
  })
}
