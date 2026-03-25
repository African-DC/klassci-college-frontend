"use client"

import { subjectsApi } from "@/lib/api/subjects"
import type { Subject, SubjectCreate, SubjectUpdate } from "@/lib/contracts/subject"
import { createCrudHooks } from "./createCrudHooks"

const {
  keys: subjectKeys,
  useList,
  useDetail,
  useCreate,
  useUpdate,
  useDelete,
} = createCrudHooks<Subject, SubjectCreate, SubjectUpdate>("subjects", subjectsApi, {
  created: "Matière créée avec succès",
  updated: "Matière mise à jour",
  deleted: "Matière supprimée",
  errorFallback: "Impossible de charger les matières",
})

export { subjectKeys }
export const useSubjects = useList
export const useSubject = useDetail
export const useCreateSubject = useCreate
export const useUpdateSubject = useUpdate
export const useDeleteSubject = useDelete
