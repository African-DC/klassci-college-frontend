"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { retakesApi, type RetakeListFilters } from "@/lib/api/retakes"
import { gradesApi } from "@/lib/api/grades"
import { gradeKeys } from "./useGrades"
import { fileSafeName } from "@/components/admin/classes/detail/class-downloads"
import { downloadBlob } from "@/lib/utils"
import type { Evaluation } from "@/lib/contracts/grade"
import type {
  RetakeAuthorization,
  RetakeAuthorizationCreate,
} from "@/lib/contracts/school-life"

export const retakeKeys = {
  all: ["school-life", "retakes"] as const,
  list: (filters: RetakeListFilters) => ["school-life", "retakes", "list", filters] as const,
  absentEvaluations: (studentId: number, classId: number, from: string, to: string) =>
    ["school-life", "retakes", "absent-evaluations", studentId, classId, from, to] as const,
}

export function useRetakeAuthorizations(filters: RetakeListFilters = {}, enabled = true) {
  return useQuery({
    queryKey: retakeKeys.list(filters),
    queryFn: () => retakesApi.list(filters),
    staleTime: 1000 * 30,
    enabled,
  })
}

interface AbsentEvaluationsParams {
  studentId?: number
  classId?: number
  periodStart?: string
  periodEnd?: string
}

/**
 * Évaluations de la classe tombées dans la période et marquées « absent »
 * pour cet élève : ce sont les seules que le backend accepte de rouvrir.
 *
 * Le backend n'expose pas ce croisement, on le fait donc ici : une requête
 * pour les évaluations de la classe, puis une par évaluation de la période
 * pour lire les notes. La période restreint le lot avant les appels, sinon on
 * interrogerait toute l'année scolaire pour rien.
 */
export function useAbsentEvaluations({
  studentId,
  classId,
  periodStart,
  periodEnd,
}: AbsentEvaluationsParams) {
  const enabled = Boolean(studentId && classId && periodStart && periodEnd)

  return useQuery({
    queryKey: retakeKeys.absentEvaluations(
      studentId ?? 0,
      classId ?? 0,
      periodStart ?? "",
      periodEnd ?? "",
    ),
    enabled,
    staleTime: 1000 * 30,
    queryFn: async (): Promise<Evaluation[]> => {
      const evaluations = await gradesApi.listEvaluations(classId as number)
      const inPeriod = evaluations.filter(
        (evaluation) =>
          evaluation.date >= (periodStart as string) && evaluation.date <= (periodEnd as string),
      )
      const missed = await Promise.all(
        inPeriod.map(async (evaluation) => {
          const grades = await gradesApi.getGrades(evaluation.id)
          const grade = grades.find((g) => g.student_id === studentId)
          return grade?.status === "absent" ? evaluation : null
        }),
      )
      return missed
        .filter((evaluation): evaluation is Evaluation => evaluation !== null)
        .sort((a, b) => a.date.localeCompare(b.date))
    },
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
