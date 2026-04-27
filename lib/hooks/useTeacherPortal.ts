"use client"

import { useQuery } from "@tanstack/react-query"
import { teacherPortalApi } from "@/lib/api/teacher-portal"

export const teacherPortalKeys = {
  all: ["teacher-portal"] as const,
  dashboard: () => ["teacher-portal", "dashboard"] as const,
  classes: () => ["teacher-portal", "classes"] as const,
  classAttendance: (classId: number) => ["teacher-portal", "class-attendance", classId] as const,
  evaluations: () => ["teacher-portal", "evaluations"] as const,
}

export function useTeacherDashboard() {
  return useQuery({
    queryKey: teacherPortalKeys.dashboard(),
    queryFn: () => teacherPortalApi.getDashboard(),
    staleTime: 1000 * 60 * 2,
  })
}

export function useTeacherClasses() {
  return useQuery({
    queryKey: teacherPortalKeys.classes(),
    queryFn: () => teacherPortalApi.getClasses(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useTeacherClassAttendance(classId: number | undefined) {
  return useQuery({
    queryKey: teacherPortalKeys.classAttendance(classId as number),
    queryFn: () => teacherPortalApi.getClassAttendance(classId as number),
    enabled: classId !== undefined && classId > 0,
    staleTime: 1000 * 60 * 5,
  })
}

export function useTeacherEvaluations() {
  return useQuery({
    queryKey: teacherPortalKeys.evaluations(),
    queryFn: () => teacherPortalApi.getEvaluations(),
    staleTime: 1000 * 60 * 2,
  })
}
