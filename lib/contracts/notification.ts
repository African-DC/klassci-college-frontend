import { z } from "zod"

// Contrats pour les notifications — endpoints /notifications/*

export const NotificationTypeSchema = z.enum([
  "payment_due", "payment_received", "grade_available",
  "bulletin_published", "absence_recorded", "enrollment_status", "system",
  // Les deux temps de la chaine d'inscription : quelqu'un doit encaisser,
  // puis quelqu'un doit valider.
  "enrollment_awaiting_payment", "enrollment_awaiting_validation",
])

export const NotificationChannelSchema = z.enum(["in_app", "sms", "whatsapp", "email"])

export const NotificationSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  // Volontairement large, et non le `z.enum` strict.
  //
  // `safeValidate` leve quand la validation echoue : une seule notification
  // d'un type que le client ne connait pas encore faisait donc tomber la
  // liste entiere, et le panneau devenait noir. Une ligne sans style vaut
  // mieux que toutes les autres invisibles.
  //
  // C'est `notificationTypeView` qui decide de l'apparence et retombe sur un
  // rendu neutre. Le serveur prend de l'avance sur le client a chaque
  // deploiement, puisque les deux ne partent pas ensemble.
  type: z.string(),
  channel: NotificationChannelSchema,
  title: z.string(),
  body: z.string(),
  read: z.boolean(),
  sent_at: z.string().nullable(),
  read_at: z.string().nullable(),
  // Ou la notification mene. Le serveur le decide : lui seul sait quelle
  // action il attend, puisque c'est lui qui a decide de prevenir.
  action_url: z.string().nullish(),
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
