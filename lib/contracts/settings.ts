import { z } from "zod"

// Miroir de app/schemas/settings.py (backend)

export const TrimesterConfigSchema = z.object({
  label: z.string(),
  start_date: z.string(),
  end_date: z.string(),
})

export const SchoolSettingsSchema = z.object({
  id: z.number(),
  school_name: z.string(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  logo_url: z.string().nullable(),
  active_academic_year: z.string().nullable(),
  trimesters: z.array(TrimesterConfigSchema),
  notify_by_email: z.boolean(),
  notify_by_sms: z.boolean(),
  notify_grades: z.boolean(),
  notify_absences: z.boolean(),
  notify_payments: z.boolean(),
})

export const SchoolInfoUpdateSchema = z.object({
  school_name: z.string({ required_error: "Le nom est requis" }).min(1, "Le nom est requis"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  active_academic_year: z.string().optional(),
})

export const TrimesterUpdateSchema = z.object({
  trimesters: z.array(TrimesterConfigSchema).length(3, "3 trimestres requis"),
})

export const NotificationUpdateSchema = z.object({
  notify_by_email: z.boolean(),
  notify_by_sms: z.boolean(),
  notify_grades: z.boolean(),
  notify_absences: z.boolean(),
  notify_payments: z.boolean(),
})

export type TrimesterConfig = z.infer<typeof TrimesterConfigSchema>
export type SchoolSettings = z.infer<typeof SchoolSettingsSchema>
export type SchoolInfoUpdate = z.infer<typeof SchoolInfoUpdateSchema>
export type TrimesterUpdate = z.infer<typeof TrimesterUpdateSchema>
export type NotificationUpdate = z.infer<typeof NotificationUpdateSchema>
