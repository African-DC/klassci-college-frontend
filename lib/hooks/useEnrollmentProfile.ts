"use client"

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { enrollmentProfileApi } from "@/lib/api/enrollment-profile"
import type {
  EnrollmentProfile,
  ProfileBatchItem,
  ScholarshipInput,
} from "@/lib/contracts/enrollment-profile"
import { informationSheetKeys } from "./useInformationSheet"

/**
 * Ce qui lit les renseignements d'une inscription : la fiche inscription, les
 * listes, et la fiche de renseignements des classes.
 */
function invalidateProfileViews(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["enrollments"] })
  queryClient.invalidateQueries({ queryKey: informationSheetKeys.all })
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
    onSuccess: () => {
      invalidateProfileViews(queryClient)
      toast.success("Renseignements enregistrés")
    },
    onError: errorToast("Renseignements non enregistrés"),
  })
}

/** Le lot de la saisie par classe : un seul envoi, tout ou rien côté serveur. */
export function useBatchUpdateEnrollmentProfiles() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (items: ProfileBatchItem[]) => enrollmentProfileApi.updateBatch(items),
    onSuccess: ({ updated }) => {
      invalidateProfileViews(queryClient)
      toast.success(
        updated === 1 ? "1 élève mis à jour" : `${updated} élèves mis à jour`,
      )
    },
    onError: errorToast("Aucune modification enregistrée"),
  })
}

export function useSetScholarship(enrollmentId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ScholarshipInput) => enrollmentProfileApi.setScholarship(enrollmentId, input),
    onSuccess: () => {
      invalidateProfileViews(queryClient)
      toast.success("Bourse enregistrée")
    },
    onError: errorToast("Bourse non enregistrée"),
  })
}

export function useRemoveScholarship(enrollmentId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => enrollmentProfileApi.removeScholarship(enrollmentId),
    onSuccess: () => {
      invalidateProfileViews(queryClient)
      toast.success("Bourse retirée : l'élève est désormais non boursier")
    },
    onError: errorToast("Impossible de retirer la bourse"),
  })
}
