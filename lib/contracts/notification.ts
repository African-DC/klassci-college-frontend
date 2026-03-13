import { z } from "zod"

// Miroir de app/schemas/notification.py (backend)
// TODO: completer quand l'endpoint GET /notifications est disponible

export const NotificationSchema = z.object({
  id: z.number(),
  title: z.string(),
  message: z.string(),
  type: z.enum(["info", "warning", "error", "success"]),
  read: z.boolean(),
  created_at: z.string(),
})

export type Notification = z.infer<typeof NotificationSchema>
