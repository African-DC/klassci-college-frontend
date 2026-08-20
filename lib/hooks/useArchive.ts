"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { archiveApi } from "@/lib/api/archive"
import {
  ARCHIVABLE_ENTITIES,
  type ArchivableEntity,
  type ArchiveQuery,
} from "@/lib/contracts/archive"

export const archiveKeys = {
  all: ["archive"] as const,
  list: (query: ArchiveQuery) => ["archive", "list", query] as const,
}

/**
 * La corbeille. Volontairement peu de cache : après un archivage fait depuis
 * une autre fiche, l'écran doit montrer l'élément qui vient d'arriver, sinon
 * l'utilisateur croit que son geste n'a pas abouti et le refait.
 */
export function useArchiveList(query: ArchiveQuery) {
  return useQuery({
    queryKey: archiveKeys.list(query),
    queryFn: () => archiveApi.list(query),
    staleTime: 15_000,
  })
}

/**
 * Après un archivage, une restauration ou une purge, la fiche concernée a
 * changé d'état des deux côtés : la corbeille et la liste métier d'origine.
 * On invalide donc précisément ces deux racines, pas tout le cache, pour ne
 * pas relancer l'ensemble des écrans ouverts.
 */
function useArchiveInvalidation() {
  const queryClient = useQueryClient()
  return (entity: ArchivableEntity) => {
    queryClient.invalidateQueries({ queryKey: archiveKeys.all })
    queryClient.invalidateQueries({ queryKey: [ARCHIVABLE_ENTITIES[entity].queryKey] })
  }
}

interface ArchiveVariables {
  entity: ArchivableEntity
  id: number
  reason: string
}

export function useArchiveEntity() {
  const invalidate = useArchiveInvalidation()

  return useMutation({
    mutationFn: ({ entity, id, reason }: ArchiveVariables) =>
      archiveApi.archive(entity, id, reason),
    onSuccess: (_data, variables) => {
      invalidate(variables.entity)
      toast.success("Fiche archivée", {
        description: "Elle a quitté les écrans. Rien n'est perdu, la corbeille la garde.",
      })
    },
    onError: (error) => {
      toast.error("Archivage impossible", { description: error.message })
    },
  })
}

export function useRestoreEntity() {
  const invalidate = useArchiveInvalidation()

  return useMutation({
    mutationFn: ({ entity, id }: { entity: ArchivableEntity; id: number }) =>
      archiveApi.restore(entity, id),
    onSuccess: (_data, variables) => {
      invalidate(variables.entity)
      toast.success("Fiche restaurée", {
        description: "Elle réapparaît dans les listes.",
      })
    },
    onError: (error) => {
      toast.error("Restauration impossible", { description: error.message })
    },
  })
}

export function usePurgeEntity() {
  const invalidate = useArchiveInvalidation()

  return useMutation({
    mutationFn: ({ entity, id, reason }: ArchiveVariables) =>
      archiveApi.purge(entity, id, reason),
    onSuccess: (_data, variables) => {
      invalidate(variables.entity)
      toast.success("Suppression définitive effectuée", {
        description: "Le motif a été enregistré et transmis à la direction.",
      })
    },
    onError: (error) => {
      toast.error("Suppression impossible", { description: error.message })
    },
  })
}
