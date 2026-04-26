"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { attendanceApi } from "@/lib/api/attendance"
import type { SessionCreatePayload, SessionUpdatePayload } from "@/lib/api/attendance"
import type { AttendanceHistoryParams } from "@/lib/contracts/attendance"

export const attendanceKeys = {
  all: ["attendance"] as const,
  sessions: ["attendance", "sessions"] as const,
  session: (classId: number, slotId: number, date: string) =>
    ["attendance", "session", classId, slotId, date] as const,
  history: (params: Record<string, unknown>) =>
    ["attendance", "history", params] as const,
  studentHistory: (studentId: number) =>
    ["attendance", "student", studentId] as const,
  classStats: (classId: number) => ["attendance", "class", classId, "stats"] as const,
}

export function useCreateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SessionCreatePayload) =>
      attendanceApi.createSession(data),
    onSuccess: (_result, variables) => {
      toast.success("Présences enregistrées")
      queryClient.invalidateQueries({ queryKey: attendanceKeys.sessions })
      queryClient.invalidateQueries({ queryKey: attendanceKeys.classStats(variables.context_id) })
    },
    onError: (err) => {
      toast.error("Erreur", { description: err.message })
    },
  })
}

export function useUpdateSession(sessionId: number, classId?: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SessionUpdatePayload) =>
      attendanceApi.updateSession(sessionId, data),
    onSuccess: () => {
      toast.success("Présences mises à jour")
      queryClient.invalidateQueries({ queryKey: attendanceKeys.sessions })
      if (classId) {
        queryClient.invalidateQueries({ queryKey: attendanceKeys.classStats(classId) })
      }
    },
    onError: (err) => {
      toast.error("Erreur", { description: err.message })
    },
  })
}

export function useStudentAttendance(studentId?: number, params: { page?: number; size?: number } = {}) {
  return useQuery({
    queryKey: [...attendanceKeys.studentHistory(studentId!), params],
    queryFn: () => attendanceApi.getStudentHistory(studentId!, params),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useClassAttendanceStats(classId?: number) {
  return useQuery({
    queryKey: attendanceKeys.classStats(classId!),
    queryFn: () => attendanceApi.getClassStats(classId!),
    enabled: !!classId,
    staleTime: 1000 * 60 * 5,
  })
}

// Backward-compatible aliases — components still import these names
/** @deprecated Use useClassAttendanceStats instead */
export const useAttendanceStats = useClassAttendanceStats

export function useAttendanceSession(classId: number, slotId: number, date: string) {
  return useQuery({
    queryKey: attendanceKeys.session(classId, slotId, date),
    queryFn: () => attendanceApi.getSession(classId, slotId, date),
    enabled: !!classId && !!slotId && !!date,
    staleTime: 1000 * 60 * 5,
  })
}

export function useSaveAttendance(classId: number, slotId: number, date: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { records: { student_id: number; status: string }[] }) =>
      attendanceApi.saveBatch(classId, slotId, date, data.records as Parameters<typeof attendanceApi.saveBatch>[3]),
    onSuccess: () => {
      toast.success("Présences enregistrées")
      queryClient.invalidateQueries({ queryKey: attendanceKeys.session(classId, slotId, date) })
      queryClient.invalidateQueries({ queryKey: attendanceKeys.classStats(classId) })
    },
    onError: (err) => {
      toast.error("Erreur", { description: err.message })
    },
  })
}

export function useAttendanceHistory(params: AttendanceHistoryParams) {
  return useQuery({
    queryKey: attendanceKeys.history(params),
    queryFn: () => attendanceApi.getHistory(params as Record<string, string | number | undefined>),
    staleTime: 1000 * 60 * 5,
  })
}
