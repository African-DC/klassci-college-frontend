"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { attendanceApi } from "@/lib/api/attendance"
import type { AttendanceBatchEntry, AttendanceHistoryParams } from "@/lib/contracts/attendance"

export const attendanceKeys = {
  all: ["attendance"] as const,
  session: (classId: number, slotId: number, date: string) =>
    ["attendance", "session", classId, slotId, date] as const,
  history: (params: Record<string, unknown>) =>
    ["attendance", "history", params] as const,
  stats: (classId: number) => ["attendance", "stats", classId] as const,
}

export function useAttendanceSession(classId?: number, slotId?: number, date?: string) {
  return useQuery({
    queryKey: attendanceKeys.session(classId!, slotId!, date!),
    queryFn: () => attendanceApi.getSession(classId!, slotId!, date!),
    enabled: !!classId && !!slotId && !!date,
    staleTime: 1000 * 60 * 2,
  })
}

export function useSaveAttendance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      slotId,
      date,
      records,
    }: {
      slotId: number
      date: string
      records: AttendanceBatchEntry[]
    }) => attendanceApi.saveBatch(slotId, date, records),
    onSuccess: () => {
      toast.success("Présences enregistrées")
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all })
    },
    onError: (err) => {
      toast.error("Erreur", { description: err.message })
    },
  })
}

export function useAttendanceHistory(params: AttendanceHistoryParams = {}) {
  return useQuery({
    queryKey: attendanceKeys.history(params as Record<string, unknown>),
    queryFn: () => attendanceApi.getHistory(params as Record<string, unknown>),
    staleTime: 1000 * 60 * 5,
  })
}

export function useAttendanceStats(classId?: number) {
  return useQuery({
    queryKey: attendanceKeys.stats(classId!),
    queryFn: () => attendanceApi.getStats(classId!),
    enabled: !!classId,
    staleTime: 1000 * 60 * 5,
  })
}
