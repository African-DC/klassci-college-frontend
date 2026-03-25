"use client"

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
  errorFallback: "Impossible de charger les élèves",
})

export { studentKeys }
export const useStudents = useList
export const useStudent = useDetail
export const useCreateStudent = useCreate
export const useUpdateStudent = useUpdate
export const useDeleteStudent = useDelete
