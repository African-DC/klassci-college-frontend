"use client"

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { enrollmentProfileApi, ProfileBatchError } from "@/lib/api/enrollment-profile"
import type {
  EnrollmentProfile,
  ProfileBatchItem,
  ScholarshipInput,
} from "@/lib/contracts/enrollment-profile"
import { describeBatchFailure } from "@/lib/enrollment/profile-batch-errors"
import { informationSheetKeys } from "./useInformationSheet"

/**
 * Ce qui lit les renseignements d'une inscription : la fiche inscription, les
 * listes, et la fiche de renseignements des classes.
 *
 * Rend la promesse du rechargement : une mutation qui l'attend ne passe la
 * main à l'écran qu'une fois les nouvelles valeurs arrivées. Sans cela, la
 * saisie par classe vidait ses brouillons et réaffichait un instant les
 * anciennes valeurs, comme si rien n'avait été enregistré.
 */
function invalidateProfileViews(queryClient: QueryClient): Promise<unknown> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["enrollments"] }),
    queryClient.invalidateQueries({ queryKey: informationSheetKeys.all }),
  ])
}

function errorToast(title: string) {
  return (error: Error) => toast.error(title, { description: error.message })
}

export function useUpdateEnrollmentProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      enrollmentId,
      changes,
    }: {
      enrollmentId: number
      changes: Partial<EnrollmentProfile>
    }) => enrollmentProfileApi.update(enrollmentId, changes),
    onSuccess: async () => {
      await invalidateProfileViews(queryClient)
      toast.success("Renseignements enregistrés")
    },
    onError: errorToast("Renseignements non enregistrés"),
  })
}

/**
 * Le lot de la saisie par classe. `nameOf` donne le nom d'un élève à partir
 * de son inscription : le message d'échec parle d'élèves, pas d'identifiants.
 */
export function useBatchUpdateEnrollmentProfiles(nameOf: (enrollmentId: number) => string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (items: ProfileBatchItem[]) => enrollmentProfileApi.updateBatch(items),
    onSuccess: async ({ updated }) => {
      await invalidateProfileViews(queryClient)
      toast.success(updated === 1 ? "1 élève mis à jour" : `${updated} élèves mis à jour`)
    },
    onError: async (error: Error) => {
      // Les lots déjà partis sont en base : on recharge pour qu'ils sortent
      // des brouillons, et il ne reste à l'écran que ce qui doit être renvoyé.
      if (error instanceof ProfileBatchError && error.updated > 0) {
        await invalidateProfileViews(queryClient)
      }
      const { title, description } = describeBatchFailure(error, nameOf)
      toast.error(title, { description })
    },
  })
}

export function useSetScholarship(enrollmentId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ScholarshipInput) => enrollmentProfileApi.setScholarship(enrollmentId, input),
    onSuccess: async () => {
      await invalidateProfileViews(queryClient)
      toast.success("Bourse enregistrée")
    },
    onError: errorToast("Bourse non enregistrée"),
  })
}

export function useRemoveScholarship(enrollmentId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => enrollmentProfileApi.removeScholarship(enrollmentId),
    onSuccess: async () => {
      await invalidateProfileViews(queryClient)
      toast.success("Bourse retirée : l'élève est désormais non boursier")
    },
    onError: errorToast("Impossible de retirer la bourse"),
  })
}
