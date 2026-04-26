"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { parentsApi } from "@/lib/api/parents"
import type { Parent, ParentCreate, ParentUpdate } from "@/lib/contracts/parent"
import { createCrudHooks } from "./createCrudHooks"

const {
  keys: parentKeys,
  useList,
  useDetail,
  useCreate,
  useUpdate,
  useDelete,
} = createCrudHooks<Parent, ParentCreate, ParentUpdate>("parents", parentsApi, {
  created: "Parent créé avec succès",
  updated: "Parent mis à jour",
  deleted: "Parent supprimé",
})

export { parentKeys }
export const useParents = useList
export const useParent = useDetail
export const useCreateParent = useCreate
export const useUpdateParent = useUpdate
export const useDeleteParent = useDelete

export function useStudentParents(studentId: number | undefined) {
  return useQuery({
    queryKey: ["student-parents", studentId],
    queryFn: () => parentsApi.getStudentParents(studentId as number),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useLinkParent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ parentId, studentId, relationshipType }: { parentId: number; studentId: number; relationshipType?: string }) =>
      parentsApi.linkToStudent(parentId, studentId, relationshipType),
    onSuccess: () => {
      toast.success("Parent lié à l'élève")
      queryClient.invalidateQueries({ queryKey: ["student-parents"] })
    },
    onError: (err: Error) => toast.error("Erreur", { description: err.message }),
  })
}

export function useUnlinkParent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ parentId, studentId }: { parentId: number; studentId: number }) =>
      parentsApi.unlinkFromStudent(parentId, studentId),
    onSuccess: () => {
      toast.success("Lien parent-élève supprimé")
      queryClient.invalidateQueries({ queryKey: ["student-parents"] })
    },
    onError: (err: Error) => toast.error("Erreur", { description: err.message }),
  })
}
