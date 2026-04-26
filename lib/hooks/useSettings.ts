"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { settingsApi } from "@/lib/api/settings"
import type { SchoolInfoUpdate, TrimesterUpdate, NotificationUpdate } from "@/lib/contracts/settings"

export const settingsKeys = {
  all: ["settings"] as const,
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
