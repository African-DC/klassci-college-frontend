"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { retakesApi, type RetakeListFilters } from "@/lib/api/retakes"
import { gradeKeys } from "./useGrades"
import { fileSafeName } from "@/components/admin/classes/detail/class-downloads"
import { downloadBlob } from "@/lib/utils"
import type {
  RetakeAuthorization,
  RetakeAuthorizationCreate,
} from "@/lib/contracts/school-life"

export const retakeKeys = {
  all: ["school-life", "retakes"] as const,
  list: (filters: RetakeListFilters) => ["school-life", "retakes", "list", filters] as const,
  missedEvaluations: (studentId: number, from: string, to: string) =>
    ["school-life", "retakes", "missed-evaluations", studentId, from, to] as const,
}

export function useRetakeAuthorizations(filters: RetakeListFilters = {}, enabled = true) {
  return useQuery({
    queryKey: retakeKeys.list(filters),
    queryFn: () => retakesApi.list(filters),
    staleTime: 1000 * 30,
    enabled,
  })
}

/**
 * Évaluations que l'élève a manquées sur la période : les seules que le
 * backend accepte de rouvrir.
 *
 * Le croisement est fait par le serveur, sur un point d'entrée gardé par le
 * droit du billet. Le reconstituer ici obligeait à lire le cahier de notes de
 * la classe, que ni l'éducateur ni le secrétariat n'ont le droit de consulter.
 */
export function useMissedEvaluations({
  studentId,
  periodStart,
  periodEnd,
}: {
  studentId?: number
  periodStart?: string
  periodEnd?: string
}) {
  const enabled = Boolean(studentId && periodStart && periodEnd && periodEnd >= periodStart)

  return useQuery({
    queryKey: retakeKeys.missedEvaluations(studentId ?? 0, periodStart ?? "", periodEnd ?? ""),
    enabled,
    staleTime: 1000 * 30,
    queryFn: () =>
      retakesApi.missedEvaluations(
        studentId as number,
        periodStart as string,
        periodEnd as string,
      ),
  })
}

export function useCreateRetakeAuthorization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: RetakeAuthorizationCreate) => retakesApi.create(data),
    onSuccess: (authorization) => {
      queryClient.invalidateQueries({ queryKey: retakeKeys.all })
      // Les notes visées passent de « absent » à « rattrapage autorisé » :
      // les feuilles de notes ouvertes ailleurs affichent encore le zéro.
      queryClient.invalidateQueries({ queryKey: gradeKeys.all })
      toast.success("Autorisation de reprise délivrée", {
        description: `${authorization.student_name} · ${authorization.evaluations.length} évaluation(s) rouverte(s)`,
      })
    },
    onError: (err: Error) =>
      toast.error("Autorisation impossible", { description: err.message }),
  })
}

export function useDownloadRetakeAuthorization() {
  return useMutation({
    mutationFn: async (authorization: RetakeAuthorization) => {
      const blob = await retakesApi.downloadDocument(authorization.id)
      downloadBlob(
        blob,
        `annulation-zero-${fileSafeName(authorization.student_name)}-${authorization.id}.pdf`,
      )
    },
    onSuccess: () => toast.success("Billet téléchargé"),
    onError: (err: Error) =>
      toast.error("Téléchargement impossible", { description: err.message }),
  })
}
