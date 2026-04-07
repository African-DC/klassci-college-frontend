import { z } from "zod"
import { apiFetch, safeValidate } from "./client"
import {
  NotificationSchema,
  NotificationCountSchema,
  type Notification,
  type NotificationCount,
  type NotificationType,
} from "@/lib/contracts/notification"

const NotificationArraySchema = z.array(NotificationSchema)

export interface NotificationListParams {
  type?: NotificationType
  is_read?: boolean
  page?: number
  size?: number
}

export const notificationsApi = {
  // Liste des notifications avec filtres
  list: async (params: NotificationListParams = {}): Promise<Notification[]> => {
    const query = new URLSearchParams()
    if (params.type) query.set("type", params.type)
    if (params.is_read !== undefined) query.set("is_read", String(params.is_read))
    if (params.page) query.set("page", String(params.page))
    if (params.size) query.set("size", String(params.size))

    const qs = query.toString()
    const res = await apiFetch<unknown>(`/notifications${qs ? `?${qs}` : ""}`)
    const arr = Array.isArray(res)
      ? res
      : (res as Record<string, unknown>).data !== undefined
        ? (res as Record<string, unknown>).data
        : res
    return safeValidate(NotificationArraySchema, arr, "GET /notifications")
  },

  // Compteur de notifications non lues
  getUnreadCount: async (): Promise<NotificationCount> => {
    const res = await apiFetch<unknown>("/notifications/count")
    return safeValidate(NotificationCountSchema, res, "GET /notifications/count")
  },

  // Marquer une notification comme lue
  markAsRead: async (id: number): Promise<void> => {
    await apiFetch<void>(`/notifications/${id}/read`, { method: "PATCH" })
  },

  // Marquer toutes les notifications comme lues
  markAllAsRead: async (): Promise<void> => {
    await apiFetch<void>("/notifications/read-all", { method: "PATCH" })
  },
}
