"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { enrollmentsApi } from "@/lib/api/enrollments"
import { invalidateEnrollmentFeeViews } from "@/lib/hooks/useEnrollments"

export const inKindRosterKeys = {
  all: ["in-kind-roster"] as const,
  classe: (classId: number, yearId: number) => ["in-kind-roster", classId, yearId] as const,
}

/** La classe entière, avec ce qu'il reste à renseigner sur chaque élève. */
export function useInKindRoster(classId: number | undefined, academicYearId: number | undefined) {
  return useQuery({
    queryKey:
      classId && academicYearId
        ? inKindRosterKeys.classe(classId, academicYearId)
        : [...inKindRosterKeys.all, "none"],
    queryFn: () => enrollmentsApi.inKindRoster(classId as number, academicYearId as number),
    enabled: Boolean(classId) && Boolean(academicYearId),
    // Court : l'éducateur travaille à deux mains, et une autre personne peut
    // avancer sur la même classe depuis un autre poste.
    staleTime: 1000 * 15,
  })
}

/**
 * Poser ou retirer un dépôt sur une ligne, et refléter la réponse du serveur.
 *
 * Une mutation par ligne, jamais un envoi global : sur une connexion qui
 * coupe, un formulaire de quarante lignes perdu est un travail qui ne sera pas
 * refait. Chaque case se sauve seule et montre son état.
 */
export function useToggleInKindDeposit(classId: number | undefined, yearId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      enrollmentId,
      feeId,
      deposer,
    }: {
      enrollmentId: number
      feeId: number
      deposer: boolean
    }) =>
      deposer
        ? enrollmentsApi.depositInKind(enrollmentId, feeId)
        : enrollmentsApi.cancelInKindDeposit(enrollmentId, feeId),
    onSuccess: (_data, { enrollmentId }) => {
      if (classId && yearId) {
        queryClient.invalidateQueries({ queryKey: inKindRosterKeys.classe(classId, yearId) })
      }
      // Le dû de cet élève vient de bouger : les écrans qui l'affichent aussi.
      invalidateEnrollmentFeeViews(queryClient, [enrollmentId])
    },
    onError: (err: Error) => {
      toast.error("Ce dépôt n'a pas pu être enregistré", { description: err.message })
    },
  })
}


/**
 * Poser le profil d'une inscription, ligne par ligne.
 *
 * `useUpdateEnrollment` fige son identifiant à la création du hook : il sert
 * une fiche, pas une liste où l'élève change à chaque ligne. Ici l'identifiant
 * voyage avec l'écriture.
 *
 * Corriger le profil régénère les frais côté serveur, comme un changement de
 * classe. C'est pour cela que la liste est rechargée après : le dû de l'élève
 * a pu bouger, et l'écran doit montrer ce que le serveur a répondu.
 */
export function useSetEnrollmentProfile(classId: number | undefined, yearId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ enrollmentId, value }: { enrollmentId: number; value: boolean | null }) =>
      enrollmentsApi.update(enrollmentId, { is_new_student: value }),
    onSuccess: (_data, { enrollmentId }) => {
      if (classId && yearId) {
        queryClient.invalidateQueries({ queryKey: inKindRosterKeys.classe(classId, yearId) })
      }
      invalidateEnrollmentFeeViews(queryClient, [enrollmentId])
    },
    onError: (err: Error) => {
      toast.error("Ce profil n'a pas pu être enregistré", { description: err.message })
    },
  })
}
