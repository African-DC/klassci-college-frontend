"use client"

import { subjectsApi } from "@/lib/api/subjects"
import type { Subject, SubjectCreate, SubjectUpdate } from "@/lib/contracts/subject"
import { createCrudHooks } from "./createCrudHooks"

/**
 * Les enseignants d'une matière viennent du serveur (liste ordonnée, premier
 * = principal) : on ne les recalcule pas en cache, l'invalidation s'en charge.
 */
function sansEnseignants(patch: SubjectUpdate): Partial<Subject> {
  const reste: Record<string, unknown> = { ...patch }
  delete reste.teacher_ids
  delete reste.teacher_id
  return reste as Partial<Subject>
}

const {
  keys: subjectKeys,
  useList,
  useDetail,
  useCreate,
  useUpdate,
  useDelete,
} = createCrudHooks<Subject, SubjectCreate, SubjectUpdate>(
  "subjects",
  subjectsApi,
  {
    created: "Matière créée avec succès",
    updated: "Matière mise à jour",
    deleted: "Matière supprimée",
  },
  { toOptimistic: sansEnseignants },
)

export { subjectKeys }
export const useSubjects = useList
export const useSubject = useDetail
export const useCreateSubject = useCreate
export const useUpdateSubject = useUpdate
export const useDeleteSubject = useDelete
