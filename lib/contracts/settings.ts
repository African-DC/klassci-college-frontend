import { z } from "zod"

// Miroir de app/schemas/settings.py (backend)
// Backend SchoolSettings: school_name, address, phone, email, logo_url, ministry_code

// UI-only: trimesters config (not yet in backend)
export const TrimesterConfigSchema = z.object({
  label: z.string(),
  start_date: z.string(),
  end_date: z.string(),
})

export const SchoolHolidaySchema = z.object({
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
  // Personnalisation PDF par école (migration BE 0029)
  primary_color: z.string().nullable().optional(),
  accent_color: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  motto: z.string().nullable().optional(),
  // --- UI-only fields ---
  active_academic_year: z.string().nullable().optional().default(null),
  trimesters: z.array(TrimesterConfigSchema).optional().default([]),
  holidays: z.array(SchoolHolidaySchema).optional().default([]),
  // Notification preferences (now backed by BE columns on school_settings — see migration 0027)
  notify_by_email: z.boolean().optional().default(false),
  notify_by_sms: z.boolean().optional().default(false),
  notify_grades: z.boolean().optional().default(false),
  notify_absences: z.boolean().optional().default(false),
  notify_payments: z.boolean().optional().default(false),
  notify_enrollment: z.boolean().optional().default(false),
  notify_reenrollment: z.boolean().optional().default(false),
})

export const SchoolInfoUpdateSchema = z.object({
  school_name: z.string({ required_error: "Le nom est requis" }).min(1, "Le nom est requis"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  ministry_code: z.string().optional(),
  head_master_name: z.string().optional(),
  head_master_title: z.string().optional(),
  primary_color: z.string().nullable().optional(),
  accent_color: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  motto: z.string().nullable().optional(),
})

export const TrimesterUpdateSchema = z.object({
  trimesters: z.array(TrimesterConfigSchema).length(3, "3 trimestres requis"),
})

export const HolidayInputSchema = z
  .object({
    label: z.string().min(1, "Libellé requis"),
    start_date: z.string().min(1, "Date de début requise"),
    end_date: z.string().min(1, "Date de fin requise"),
  })
  .refine((h) => !h.start_date || !h.end_date || h.end_date >= h.start_date, {
    message: "La date de fin doit être après le début",
    path: ["end_date"],
  })

export const HolidaysUpdateSchema = z.object({
  holidays: z.array(HolidayInputSchema),
})

export const NotificationUpdateSchema = z.object({
  notify_by_email: z.boolean(),
  notify_by_sms: z.boolean(),
  notify_grades: z.boolean(),
  notify_absences: z.boolean(),
  notify_payments: z.boolean(),
  notify_enrollment: z.boolean(),
  notify_reenrollment: z.boolean(),
})

export type TrimesterConfig = z.infer<typeof TrimesterConfigSchema>
export type SchoolHoliday = z.infer<typeof SchoolHolidaySchema>
export type SchoolSettings = z.infer<typeof SchoolSettingsSchema>
export type SchoolInfoUpdate = z.infer<typeof SchoolInfoUpdateSchema>
export type TrimesterUpdate = z.infer<typeof TrimesterUpdateSchema>
export type HolidaysUpdate = z.infer<typeof HolidaysUpdateSchema>
export type NotificationUpdate = z.infer<typeof NotificationUpdateSchema>
