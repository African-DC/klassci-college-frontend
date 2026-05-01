import { z } from "zod"

// Miroir de app/schemas/settings.py (backend)
// Backend SchoolSettings: school_name, address, phone, email, logo_url, ministry_code

// UI-only: trimesters config (not yet in backend)
export const TrimesterConfigSchema = z.object({
  label: z.string(),
  start_date: z.string(),
  end_date: z.string(),
})

export const SchoolSettingsSchema = z.object({
  id: z.number().optional(),
  // --- Fields from backend ---
  school_name: z.string(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  logo_url: z.string().nullable(),
  ministry_code: z.string().nullable().optional(),
  // Official documents (PR #105)
  signature_image_url: z.string().nullable().optional(),
  head_master_name: z.string().nullable().optional(),
  head_master_title: z.string().nullable().optional(),
  enrollment_number_pattern: z.string().nullable().optional(),
  enrollment_number_counter: z.number().optional().default(0),
  // --- UI-only fields (not yet in backend, optional with defaults) ---
  active_academic_year: z.string().nullable().optional().default(null),
  trimesters: z.array(TrimesterConfigSchema).optional().default([]),
  notify_by_email: z.boolean().optional().default(false),
  notify_by_sms: z.boolean().optional().default(false),
  notify_grades: z.boolean().optional().default(false),
  notify_absences: z.boolean().optional().default(false),
  notify_payments: z.boolean().optional().default(false),
})

export const SchoolInfoUpdateSchema = z.object({
  school_name: z.string({ required_error: "Le nom est requis" }).min(1, "Le nom est requis"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  ministry_code: z.string().optional(),
  head_master_name: z.string().optional(),
  head_master_title: z.string().optional(),
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
