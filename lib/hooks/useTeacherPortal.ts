"use client"

import { useQuery } from "@tanstack/react-query"
import { teacherPortalApi } from "@/lib/api/teacher-portal"

export const teacherPortalKeys = {
  all: ["teacher-portal"] as const,
  dashboard: () => ["teacher-portal", "dashboard"] as const,
  classes: () => ["teacher-portal", "classes"] as const,
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
