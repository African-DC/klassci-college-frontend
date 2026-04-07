"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { notificationsApi, type NotificationListParams } from "@/lib/api/notifications"
import type { Notification } from "@/lib/contracts/notification"

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (params: NotificationListParams) => ["notifications", "list", params] as const,
  count: () => ["notifications", "count"] as const,
}

export function useNotifications(params: NotificationListParams = {}) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => notificationsApi.list(params),
    staleTime: 1000 * 60 * 2,
  })
}

export function useNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.count(),
    queryFn: () => notificationsApi.getUnreadCount(),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 30,
  })
}

export function useMarkAsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all })
      // Mise à jour optimiste du compteur
      const prevCount = queryClient.getQueryData<{ count: number }>(notificationKeys.count())
      if (prevCount && prevCount.count > 0) {
        queryClient.setQueryData(notificationKeys.count(), {
          count: prevCount.count - 1,
        })
      }
      // Mise à jour optimiste de la liste
      const queries = queryClient.getQueriesData<Notification[]>({
        queryKey: ["notifications", "list"],
      })
      for (const [key, data] of queries) {
        if (data) {
          queryClient.setQueryData(
            key,
            data.map((n) => (n.id === id ? { ...n, read: true } : n)),
          )
        }
      }
      return { prevCount, queries }
    },
    onError: (_err, _id, context) => {
      if (context?.prevCount) {
        queryClient.setQueryData(notificationKeys.count(), context.prevCount)
      }
      if (context?.queries) {
        for (const [key, data] of context.queries) {
          queryClient.setQueryData(key, data)
        }
      }
      toast.error("Erreur", { description: "Impossible de marquer comme lu." })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all })
      // Compteur à zéro
      const prevCount = queryClient.getQueryData<{ count: number }>(notificationKeys.count())
      queryClient.setQueryData(notificationKeys.count(), { count: 0 })
      // Toutes les notifications marquées comme lues
      const queries = queryClient.getQueriesData<Notification[]>({
        queryKey: ["notifications", "list"],
      })
      for (const [key, data] of queries) {
        if (data) {
          queryClient.setQueryData(
            key,
            data.map((n) => ({ ...n, read: true })),
          )
        }
      }
      return { prevCount, queries }
    },
    onError: (_err, _vars, context) => {
      if (context?.prevCount) {
        queryClient.setQueryData(notificationKeys.count(), context.prevCount)
      }
      if (context?.queries) {
        for (const [key, data] of context.queries) {
          queryClient.setQueryData(key, data)
        }
      }
      toast.error("Erreur", { description: "Impossible de tout marquer comme lu." })
    },
    onSuccess: () => {
      toast.success("Toutes les notifications marquées comme lues")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}
