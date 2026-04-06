import { z } from "zod"

// Contrats pour les notifications — endpoints /notifications/*

export const NotificationTypeSchema = z.enum([
  "inscription",
  "note",
  "paiement",
  "absence",
  "systeme",
])

export const NotificationSchema = z.object({
  id: z.number(),
  type: NotificationTypeSchema,
  title: z.string(),
  message: z.string(),
  is_read: z.boolean(),
  link: z.string().nullish(),
  created_at: z.string(),
})

export const NotificationCountSchema = z.object({
  unread_count: z.number(),
})

export type NotificationType = z.infer<typeof NotificationTypeSchema>
export type Notification = z.infer<typeof NotificationSchema>
export type NotificationCount = z.infer<typeof NotificationCountSchema>
