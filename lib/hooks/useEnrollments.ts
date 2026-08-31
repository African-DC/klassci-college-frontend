"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { enrollmentsApi } from "@/lib/api/enrollments"
import type { Enrollment, EnrollmentCreate, EnrollmentUpdate, NewEnrollment, ReEnrollment } from "@/lib/contracts/enrollment"
import { createCrudHooks } from "./createCrudHooks"

const {
  keys: enrollmentKeys,
  useList,
  useInfiniteList,
  useDetail,
  useCreate,
  useUpdate,
  useDelete,
} = createCrudHooks<Enrollment, EnrollmentCreate, EnrollmentUpdate>("enrollments", enrollmentsApi, {
  created: "Inscription creee avec succes",
  updated: "Inscription mise a jour",
  deleted: "Inscription supprimee",
})

export { enrollmentKeys }
export const useEnrollments = useList
export const useInfiniteEnrollments = useInfiniteList
export const useEnrollment = useDetail
export const useCreateEnrollment = useCreate
export const useUpdateEnrollment = useUpdate
export const useDeleteEnrollment = useDelete

export function useCreateWithStudent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: NewEnrollment) => enrollmentsApi.createWithStudent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] })
      queryClient.invalidateQueries({ queryKey: ["students"] })
      toast.success("Inscription enregistree")
    },
    onError: (error: Error) => {
      toast.error("Erreur", { description: error.message })
    },
  })
}

export function useReEnroll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ReEnrollment) => enrollmentsApi.reEnroll(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] })
      toast.success("Reinscription enregistree")
    },
    onError: (error: Error) => {
      toast.error("Erreur", { description: error.message })
    },
  })
}

export function useFeeVariants(classId: number | undefined) {
  return useQuery({
    queryKey: ["enrollments", "fee-variants", classId],
    queryFn: () => enrollmentsApi.getFeeVariants(classId!),
    enabled: !!classId,
  })
}

export function useValidateEnrollment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => enrollmentsApi.validate(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.all })
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.detail(data.id) })
      toast.success("Inscription validée")
    },
    onError: (error: Error) => {
      toast.error("Validation impossible", { description: error.message })
    },
  })
}

/**
 * Valide plusieurs inscriptions d'un coup.
 *
 * Le retour distingue ce qui est passé de ce qui a refusé, avec le motif :
 * un lot de trente dossiers dont deux échouent doit dire lesquels, sinon le
 * secrétariat rouvre les trente pour comprendre.
 */
export function useBulkValidateEnrollments() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: number[]) => enrollmentsApi.bulkValidate(ids),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.all })
      const n = res.validated.length
      if (n > 0) {
        toast.success(
          n === 1 ? "1 inscription validée" : `${n} inscriptions validées`,
        )
      }
      if (res.failed.length > 0) {
        toast.error(
          res.failed.length === 1
            ? "1 inscription n'a pas pu être validée"
            : `${res.failed.length} inscriptions n'ont pas pu être validées`,
          // Le premier motif suffit à orienter : les autres sont dans la liste,
          // qui se recharge avec les statuts à jour.
          { description: res.failed[0].reason },
        )
      }
    },
    onError: (error: Error) => {
      toast.error("Validation impossible", { description: error.message })
    },
  })
}

/**
 * Régénère les frais d'une ou plusieurs inscriptions.
 *
 * La fiche élève régénère toutes ses inscriptions d'un coup, la fiche
 * inscription une seule : le même geste, le même appel, le même message. Un
 * échec sur une inscription ne doit pas masquer les autres, d'où le traitement
 * ligne par ligne plutôt qu'un `Promise.all` qui s'arrête à la première erreur.
 */
export function useRegenerateFees() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (enrollmentIds: number[]) => {
      const settled = await Promise.allSettled(
        enrollmentIds.map((id) => enrollmentsApi.regenerateFees(id)),
      )
      const done = settled.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []))
      const failed = settled.filter((r) => r.status === "rejected").length
      if (done.length === 0) {
        const first = settled.find((r) => r.status === "rejected")
        throw first?.status === "rejected" && first.reason instanceof Error
          ? first.reason
          : new Error("La régénération des frais a échoué")
      }
      return { done, failed }
    },
    onSuccess: ({ done, failed }) => {
      queryClient.invalidateQueries({ queryKey: ["students"] })
      queryClient.invalidateQueries({ queryKey: ["enrollments"] })
      queryClient.invalidateQueries({ queryKey: ["payments"] })
      // Le décompte vient du serveur, qui seul sait ce qu'il a remplacé et ce
      // qu'il a gardé. On affiche sa phrase, sans la réécrire.
      const message = done.map((r) => r.message).find((m) => !!m)
      toast.success("Frais régénérés", { description: message ?? undefined })
      if (failed > 0) {
        toast.error(
          failed === 1
            ? "1 inscription n'a pas pu être régénérée"
            : `${failed} inscriptions n'ont pas pu être régénérées`,
        )
      }
    },
    onError: (error: Error) => {
      toast.error("Régénération impossible", { description: error.message })
    },
  })
}
