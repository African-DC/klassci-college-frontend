"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { councilApi, type CouncilGenerateInput } from "@/lib/api/council"
import type { CouncilDecisionUpdate } from "@/lib/contracts/council"

export const councilKeys = {
  all: ["council"] as const,
  minutes: (classId: number, trimester: string, academicYearId: number) =>
    ["council", "minutes", classId, trimester, academicYearId] as const,
}

// Récupérer le PV d'une classe/trimestre/année.
export function useCouncilMinutes(
  classId: number | undefined,
  trimester: string | undefined,
  academicYearId: number | undefined,
) {
  const enabled = !!classId && !!trimester && !!academicYearId
  return useQuery({
    queryKey: enabled
      ? councilKeys.minutes(classId as number, trimester as string, academicYearId as number)
      : ["council", "minutes", "none"],
    queryFn: () =>
      councilApi.getMinutes(classId as number, trimester as string, academicYearId as number),
    enabled,
    staleTime: 1000 * 60 * 5,
    // Le PV peut ne pas exister encore (404) : pas de retry en boucle.
    retry: false,
  })
}

// Générer le PV à partir des bulletins.
export function useGenerateCouncil(
  classId: number,
  trimester: string,
  academicYearId: number,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CouncilGenerateInput) => councilApi.generateMinutes(data),
    onSuccess: () => {
      toast.success("Procès-verbal généré")
      queryClient.invalidateQueries({
        queryKey: councilKeys.minutes(classId, trimester, academicYearId),
      })
    },
    onError: (err) => {
      toast.error("Génération impossible", { description: err.message })
    },
  })
}

// Mettre à jour les décisions — invalidation ciblée sur la classe/trimestre/année.
export function useUpdateDecisions(
  classId: number,
  trimester: string,
  academicYearId: number,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      minutesId,
      decisions,
    }: {
      minutesId: number
      decisions: CouncilDecisionUpdate[]
    }) => councilApi.updateDecisions(minutesId, decisions),
    onSuccess: () => {
      toast.success("Décisions enregistrées")
      queryClient.invalidateQueries({
        queryKey: councilKeys.minutes(classId, trimester, academicYearId),
      })
    },
    onError: (err) => {
      toast.error("Erreur", { description: err.message })
    },
  })
}

// Valider le PV — invalidation ciblée sur la classe/trimestre/année.
export function useValidateCouncil(
  classId: number,
  trimester: string,
  academicYearId: number,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (minutesId: number) => councilApi.validate(minutesId),
    onSuccess: () => {
      toast.success("Procès-verbal validé avec succès")
      queryClient.invalidateQueries({
        queryKey: councilKeys.minutes(classId, trimester, academicYearId),
      })
    },
    onError: (err) => {
      toast.error("Erreur", { description: err.message })
    },
  })
}
