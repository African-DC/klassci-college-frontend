"use client"

import { useQuery } from "@tanstack/react-query"
import { studentPortalApi } from "@/lib/api/student-portal"

export const studentPortalKeys = {
  all: ["student-portal"] as const,
  dashboard: () => ["student-portal", "dashboard"] as const,
  grades: (trimester?: string) => ["student-portal", "grades", trimester] as const,
  timetable: () => ["student-portal", "timetable"] as const,
  fees: () => ["student-portal", "fees"] as const,
  bulletins: () => ["student-portal", "bulletins"] as const,
}

export function useStudentDashboard() {
  return useQuery({
    queryKey: studentPortalKeys.dashboard(),
    queryFn: () => studentPortalApi.getDashboard(),
    staleTime: 1000 * 60 * 2,
  })
}

export function useStudentGrades(trimester?: string) {
  return useQuery({
    queryKey: studentPortalKeys.grades(trimester),
    queryFn: () => studentPortalApi.getGrades(trimester),
    staleTime: 1000 * 60 * 5,
  })
}

export function useStudentTimetable() {
  return useQuery({
    queryKey: studentPortalKeys.timetable(),
    queryFn: () => studentPortalApi.getTimetable(),
    staleTime: 1000 * 60 * 10,
  })
}

export function useStudentFees() {
  return useQuery({
    queryKey: studentPortalKeys.fees(),
    queryFn: () => studentPortalApi.getFees(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useStudentBulletins() {
  return useQuery({
    queryKey: studentPortalKeys.bulletins(),
    queryFn: () => studentPortalApi.getBulletins(),
    staleTime: 1000 * 60 * 10,
  })
}
