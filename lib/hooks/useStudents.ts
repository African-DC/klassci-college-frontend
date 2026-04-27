"use client"

import { useQuery } from "@tanstack/react-query"
import { studentsApi } from "@/lib/api/students"
import type { Student, StudentCreate, StudentUpdate } from "@/lib/contracts/student"
import { createCrudHooks } from "./createCrudHooks"

const {
  keys: studentKeys,
  useList,
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
