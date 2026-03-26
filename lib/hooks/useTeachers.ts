"use client"

import { teachersApi } from "@/lib/api/teachers"
import type { Teacher, TeacherCreate, TeacherUpdate } from "@/lib/contracts/teacher"
import { createCrudHooks } from "./createCrudHooks"

const {
  keys: teacherKeys,
  useList,
  useDetail,
  useCreate,
  useUpdate,
  useDelete,
} = createCrudHooks<Teacher, TeacherCreate, TeacherUpdate>("teachers", teachersApi, {
  created: "Enseignant créé avec succès",
  updated: "Enseignant mis à jour",
  deleted: "Enseignant supprimé",
})

export { teacherKeys }
export const useTeachers = useList
export const useTeacher = useDetail
export const useCreateTeacher = useCreate
export const useUpdateTeacher = useUpdate
export const useDeleteTeacher = useDelete
