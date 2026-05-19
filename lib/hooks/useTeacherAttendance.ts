"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  teacherAttendanceApi,
  type TeacherAttendanceListParams,
} from "@/lib/api/teacher-attendance"
import type {
  TeacherAttendanceCreate,
  TeacherAttendanceValidateInput,
  TeacherSelfDeclareCreate,
} from "@/lib/contracts/teacher-attendance"

export const teacherAttendanceKeys = {
  all: ["teacher-attendance"] as const,
  list: (teacherId: number, params: TeacherAttendanceListParams) =>
    ["teacher-attendance", "list", teacherId, params] as const,
  stats: (teacherId: number, academicYearId?: number) =>
    ["teacher-attendance", "stats", teacherId, academicYearId] as const,
}

const STALE_TIME = 1000 * 60 // 1 minute

export function useTeacherAttendanceList(
  teacherId: number,
  params: TeacherAttendanceListParams,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: teacherAttendanceKeys.list(teacherId, params),
    queryFn: () => teacherAttendanceApi.list(teacherId, params),
    enabled: options.enabled !== false && teacherId > 0,
    staleTime: STALE_TIME,
  })
}

export function useTeacherAttendanceStats(
  teacherId: number,
  academicYearId?: number,
) {
  return useQuery({
    queryKey: teacherAttendanceKeys.stats(teacherId, academicYearId),
    queryFn: () => teacherAttendanceApi.stats(teacherId, academicYearId),
    enabled: teacherId > 0,
    staleTime: STALE_TIME,
  })
}

/** Shared error toast for mutations: BE message si présent, fallback générique. */
function errorToast(fallback: string) {
  return (err: Error) => toast.error(err.message || fallback)
}

export function useRecordTeacherAttendance(teacherId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: TeacherAttendanceCreate) =>
      teacherAttendanceApi.recordAsAdmin(teacherId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherAttendanceKeys.all })
      toast.success("Pointage enregistré")
    },
    onError: errorToast("Erreur lors de l'enregistrement"),
  })
}

export function useValidateTeacherAttendance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      attendanceId: number
      data: TeacherAttendanceValidateInput
    }) => teacherAttendanceApi.validate(params.attendanceId, params.data),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: teacherAttendanceKeys.all })
      const approved = vars.data.approved !== false
      toast.success(approved ? "Déclaration validée" : "Déclaration rejetée")
    },
    onError: errorToast("Erreur lors de la validation"),
  })
}

export function useDeleteTeacherAttendance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (attendanceId: number) =>
      teacherAttendanceApi.delete(attendanceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherAttendanceKeys.all })
      toast.success("Pointage annulé")
    },
    onError: errorToast("Erreur lors de l'annulation"),
  })
}

export function useSelfDeclareAttendance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: TeacherSelfDeclareCreate) =>
      teacherAttendanceApi.selfDeclare(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherAttendanceKeys.all })
      toast.success("Déclaration envoyée", {
        description: "En attente de validation par l'administration.",
      })
    },
    onError: errorToast("Erreur lors de la déclaration"),
  })
}
