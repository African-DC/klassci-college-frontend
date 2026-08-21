"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { cashSessionsApi } from "@/lib/api/cash-sessions"
import type { CashSessionClose, CashSessionRegularize } from "@/lib/contracts/cash-session"

export const cashSessionKeys = {
  all: ["cash-sessions"] as const,
  mine: (businessDate?: string) => ["cash-sessions", "me", businessDate ?? "today"] as const,
  dailyPoint: (businessDate?: string) => ["cash-sessions", "point", businessDate ?? "today"] as const,
  toRegularize: () => ["cash-sessions", "to-regularize"] as const,
}

/** Ma caisse du jour. Rafraîchie souvent : le total bouge à chaque encaissement. */
export function useMyCashSession(businessDate?: string) {
  return useQuery({
    queryKey: cashSessionKeys.mine(businessDate),
    queryFn: () => cashSessionsApi.mine(businessDate),
    staleTime: 1000 * 30,
  })
}

export function useDailyCashPoint(businessDate?: string) {
  return useQuery({
    queryKey: cashSessionKeys.dailyPoint(businessDate),
    queryFn: () => cashSessionsApi.dailyPoint(businessDate),
    staleTime: 1000 * 60,
  })
}

export function useCloseMyCashSession(businessDate?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CashSessionClose) => cashSessionsApi.close(data, businessDate),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: cashSessionKeys.all })
      const variance = session.variance ?? 0
      if (variance === 0) {
        toast.success("Journée clôturée", { description: "La caisse tombe juste." })
        return
      }
      // L'écart n'est pas une erreur : il doit être vu et expliqué, pas masqué.
      const label = variance < 0 ? "Manquant" : "Excédent"
      const amount = Math.abs(variance).toLocaleString("fr-FR")
      toast.warning("Journée clôturée", { description: `${label} de ${amount} FCFA.` })
    },
    onError: (err) => {
      toast.error("Clôture impossible", { description: err.message })
    },
  })
}

/**
 * Ce que le caissier doit régulariser. Interrogé à chaque montage de l'écran
 * caisse : c'est la première chose qu'il doit voir en arrivant le matin.
 * Une liste vide est la réponse normale, pas une erreur.
 */
export function useCashSessionsToRegularize() {
  return useQuery({
    queryKey: cashSessionKeys.toRegularize(),
    queryFn: () => cashSessionsApi.toRegularize(),
    staleTime: 1000 * 60,
  })
}

export function useRegularizeCashSession(businessDate: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CashSessionRegularize) =>
      cashSessionsApi.regularize(businessDate, data),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: cashSessionKeys.all })
      const variance = session.variance ?? 0
      if (variance === 0) {
        toast.success("Journée régularisée", { description: "La caisse tombe juste." })
        return
      }
      // L'écart n'est pas une erreur : c'est justement ce qu'on cherchait à
      // connaître. Il doit être vu et expliqué, pas masqué.
      const label = variance < 0 ? "Manquant" : "Excédent"
      const amount = Math.abs(variance).toLocaleString("fr-FR")
      toast.warning("Journée régularisée", { description: `${label} de ${amount} FCFA.` })
    },
    onError: (err) => {
      toast.error("Régularisation impossible", { description: err.message })
    },
  })
}
