"use client"

import { useQuery } from "@tanstack/react-query"
import { studentsApi } from "@/lib/api/students"
import type { Student, StudentCreate, StudentUpdate } from "@/lib/contracts/student"
import { createCrudHooks } from "./createCrudHooks"

const {
  keys: studentKeys,
  useList,
  useInfiniteList,
  useDetail,
  useCreate,
  useUpdate,
  useDelete,
} = createCrudHooks<Student, StudentCreate, StudentUpdate>("students", studentsApi, {
  created: "Élève créé avec succès",
  updated: "Élève mis à jour",
  deleted: "Élève supprimé",
})

export { studentKeys }
export const useStudents = useList
export const useInfiniteStudents = useInfiniteList
export const useStudent = useDetail
export const useCreateStudent = useCreate
export const useUpdateStudent = useUpdate
export const useDeleteStudent = useDelete

export function useStudentFees(studentId: number) {
  return useQuery({
    queryKey: ["students", studentId, "fees"],
    queryFn: () => studentsApi.getEnrollmentFees(studentId),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 2,
  })
}

// Vue enrichie /admin/students/{id}/full : KPIs annuels + breakdowns trimestre.
// Utilisé par OverviewTab, ProfileTab (account info) et StudentAcademicCharts.
export function useStudentFull(studentId: number) {
  return useQuery({
    queryKey: ["students", studentId, "full"],
    queryFn: () => studentsApi.getFull(studentId),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 2,
  })
}

// Counts pour la barre de chips. staleTime aligné avec le cache BE Redis (60s
// quand celui-ci sera ajouté en v1.2.1). Invalidate via studentKeys.all après
// toute mutation student / enrollment.
export function useStudentFilters() {
  return useQuery({
    queryKey: ["students", "filters"],
    queryFn: () => studentsApi.getFilters(),
    staleTime: 1000 * 60,
  })
}

/**
 * La suggestion « nouvel élève » du serveur, pour pré-remplir la case.
 *
 * Ce n'est qu'une suggestion : l'écran doit rester capable de la contredire, et
 * ne rien pré-cocher quand elle rend `null`. Pas de `retry` inutile, l'écran sait
 * fonctionner sans elle.
 */
export function useNewStudentSuggestion(
  studentId: number | undefined,
  academicYearId: number | undefined,
) {
  return useQuery({
    queryKey: ["students", studentId, "new-student-suggestion", academicYearId],
    queryFn: () => studentsApi.getNewStudentSuggestion(studentId!, academicYearId!),
    enabled: !!studentId && !!academicYearId,
    staleTime: 1000 * 60 * 5,
    retry: false,
  })
}
