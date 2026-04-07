import { z } from "zod"

// Contrats pour les notifications — endpoints /notifications/*

export const NotificationTypeSchema = z.enum([
  "payment_due", "payment_received", "grade_available",
  "bulletin_published", "absence_recorded", "enrollment_status", "system",
])

export const NotificationChannelSchema = z.enum(["in_app", "sms", "whatsapp", "email"])

export const NotificationSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  type: NotificationTypeSchema,
  channel: NotificationChannelSchema,
  title: z.string(),
  body: z.string(),
  read: z.boolean(),
  sent_at: z.string().nullable(),
  read_at: z.string().nullable(),
  entity_type: z.string().nullable(),
  entity_id: z.number().nullable(),
  created_at: z.string(),
}).passthrough()

export const NotificationCountSchema = z.object({
  count: z.number(),
})

export const MarkAllReadSchema = z.object({
  updated: z.number(),
})

export type NotificationType = z.infer<typeof NotificationTypeSchema>
export type Notification = z.infer<typeof NotificationSchema>
export type NotificationCount = z.infer<typeof NotificationCountSchema>
