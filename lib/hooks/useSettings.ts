"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { settingsApi } from "@/lib/api/settings"
import type {
  SchoolInfoUpdate,
  TrimesterUpdate,
  HolidaysUpdate,
  NotificationUpdate,
} from "@/lib/contracts/settings"

export const settingsKeys = {
  all: ["settings"] as const,
  historyCoverage: ["settings", "enrollment-history-coverage"] as const,
}

/**
 * Ce que cocher « historique complet » impliquerait, en chiffres.
 *
 * Relu court : l'ecole reconstitue son annee passee dossier par dossier, et le
 * chiffre affiche a cote de la case doit suivre sa progression.
 */
export function useEnrollmentHistoryCoverage() {
  return useQuery({
    queryKey: settingsKeys.historyCoverage,
    queryFn: settingsApi.enrollmentHistoryCoverage,
    staleTime: 1000 * 30,
  })
}

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: settingsApi.get,
    staleTime: 1000 * 60 * 10, // 10 minutes — rarement modifié
  })
}

export function useUpdateSchoolInfo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SchoolInfoUpdate) => settingsApi.updateSchoolInfo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all })
      toast.success("Informations mises à jour")
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la mise à jour")
    },
  })
}

export function useUpdateTrimesters() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: TrimesterUpdate) => settingsApi.updateTrimesters(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all })
      toast.success("Trimestres mis à jour")
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la mise à jour")
    },
  })
}

export function useUpdateHolidays() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: HolidaysUpdate) => settingsApi.updateHolidays(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all })
      toast.success("Congés mis à jour")
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la mise à jour")
    },
  })
}

export function useUpdateNotifications() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: NotificationUpdate) => settingsApi.updateNotifications(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all })
      toast.success("Notifications mises à jour")
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la mise à jour")
    },
  })
}
