"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { profileApi } from "@/lib/api/profile"
import type { MyProfile } from "@/lib/contracts/profile"

export const profileKeys = {
  me: ["profile", "me"] as const,
  notifications: ["profile", "me", "notifications"] as const,
}

export function useMyProfile() {
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: profileApi.me,
    staleTime: 1000 * 60 * 5,
  })
}

export function useNotificationPrefs() {
  return useQuery({
    queryKey: profileKeys.notifications,
    queryFn: profileApi.notifications,
    staleTime: 1000 * 60 * 5,
  })
}

export function useUpdateNotificationPrefs() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: profileApi.updateNotifications,
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.notifications, data)
      toast.success("Préférences enregistrées")
    },
    onError: (err: Error) => toast.error("Erreur", { description: err.message }),
  })
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: profileApi.update,
    onSuccess: (data: MyProfile) => {
      queryClient.setQueryData(profileKeys.me, data)
      toast.success("Profil mis à jour")
    },
    onError: (err: Error) => toast.error("Erreur", { description: err.message }),
  })
}
