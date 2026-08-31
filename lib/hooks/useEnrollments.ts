"use client"

import { useQuery, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { enrollmentsApi } from "@/lib/api/enrollments"
import type { Enrollment, EnrollmentCreate, EnrollmentUpdate, NewEnrollment, ReEnrollment } from "@/lib/contracts/enrollment"
import { createCrudHooks } from "./createCrudHooks"
import { installmentKeys } from "./useInstallments"

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
 * Tout ce qui dérive des frais d'une inscription, remis en cause d'un coup.
 *
 * L'échéancier en fait partie : il affiche « En retard de X FCFA » à partir des
 * lignes que la régénération vient de réécrire, et son cache dure une minute.
 * Sans cette invalidation, la carte continue d'annoncer un retard calculé sur
 * des frais qui n'existent plus.
 */
export function invalidateEnrollmentFeeViews(
  queryClient: QueryClient,
  enrollmentIds: number[],
) {
  queryClient.invalidateQueries({ queryKey: ["students"] })
  queryClient.invalidateQueries({ queryKey: ["enrollments"] })
  queryClient.invalidateQueries({ queryKey: ["payments"] })
  for (const id of enrollmentIds) {
    queryClient.invalidateQueries({ queryKey: installmentKeys.schedule(id) })
  }
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
    onSuccess: ({ done, failed }, enrollmentIds) => {
      invalidateEnrollmentFeeViews(queryClient, enrollmentIds)
      // Le décompte vient du serveur, qui seul sait ce qu'il a remplacé et ce
      // qu'il a gardé. On affiche ses phrases, toutes, sans les réécrire : n'en
      // garder qu'une jetterait ce qu'il a dit des autres inscriptions.
      const phrases = Array.from(
        new Set(done.map((r) => r.message?.trim()).filter((m): m is string => !!m)),
      )
      const description = phrases.length > 0 ? phrases.join(" ") : undefined
      // Un seul retour, et il dit d'abord ce qui a échoué : annoncer la
      // réussite en vert avant le rouge ferait lire « c'est fait » à qui part
      // aussitôt sur le dossier suivant.
      if (failed > 0) {
        toast.error(
          `${failed === 1 ? "1 inscription n'a pas pu être régénérée" : `${failed} inscriptions n'ont pas pu être régénérées`}, ${
            done.length === 1 ? "1 l'a été" : `${done.length} l'ont été`
          }`,
          { description },
        )
        return
      }
      toast.success(
        done.length > 1 ? `Frais régénérés sur ${done.length} inscriptions` : "Frais régénérés",
        { description },
      )
    },
    onError: (error: Error) => {
      toast.error("Régénération impossible", { description: error.message })
    },
  })
}
