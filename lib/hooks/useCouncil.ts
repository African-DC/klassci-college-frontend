"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { councilApi } from "@/lib/api/council"
import type { CouncilDecisionUpdate } from "@/lib/contracts/council"

export const councilKeys = {
  all: ["council"] as const,
  minutes: (classId: number, trimester: string) =>
    ["council", "minutes", classId, trimester] as const,
}

// Récupérer le PV d'une classe/trimestre
export function useCouncilMinutes(classId: number | undefined, trimester: string | undefined) {
  return useQuery({
    queryKey: councilKeys.minutes(classId ?? 0, trimester ?? ""),
    queryFn: () => councilApi.getMinutes(classId!, trimester!),
    enabled: !!classId && !!trimester,
    staleTime: 1000 * 60 * 5,
  })
}

// Mettre à jour les décisions
export function useUpdateDecisions() {
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
      queryClient.invalidateQueries({ queryKey: councilKeys.all })
    },
    onError: (err) => {
      toast.error("Erreur", { description: err.message })
    },
  })
}

// Valider le PV
export function useValidateCouncil() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (minutesId: number) => councilApi.validate(minutesId),
    onSuccess: () => {
      toast.success("Procès-verbal validé avec succès")
      queryClient.invalidateQueries({ queryKey: councilKeys.all })
    },
    onError: (err) => {
      toast.error("Erreur", { description: err.message })
    },
  })
}
