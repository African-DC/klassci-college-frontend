import { z } from "zod"

/** Destinataire de test avec interrupteur actif/inactif. */
export const MailPulseRecipientSchema = z.object({
  value: z.string(),
  enabled: z.boolean(),
})
export type MailPulseRecipient = z.infer<typeof MailPulseRecipientSchema>

/** Réponse GET /admin/settings/mailpulse — la clé API n'est jamais renvoyée. */
export const MailPulseConfigSchema = z.object({
  enabled: z.boolean(),
  base_url: z.string(),
  api_key_set: z.boolean(),
  sender_email: z.string().nullable(),
  sender_name: z.string().nullable(),
  default_language: z.string(),
  timeout: z.number(),
  real_workflows_enabled: z.boolean(),
  test_email_enabled: z.boolean(),
  test_whatsapp_enabled: z.boolean(),
  test_email_recipients: z.array(MailPulseRecipientSchema),
  test_phone_recipients: z.array(MailPulseRecipientSchema),
  inbound_secret_set: z.boolean(),
})
export type MailPulseConfig = z.infer<typeof MailPulseConfigSchema>

/** Corps du formulaire de configuration (PUT). Secrets write-only, vides = conservés. */
export const MailPulseConfigFormSchema = z.object({
  enabled: z.boolean(),
  base_url: z
    .string()
    .min(1, "L'URL est requise")
    .refine((v) => /^https?:\/\//.test(v), "L'URL doit commencer par http:// ou https://"),
  api_key: z.string().optional(),
  sender_email: z
    .string()
    .email("Email invalide")
    .or(z.literal(""))
    .optional(),
  sender_name: z.string().optional(),
  default_language: z.string(),
  timeout: z.coerce.number().int().min(5).max(120),
  real_workflows_enabled: z.boolean(),
  test_email_enabled: z.boolean(),
  test_whatsapp_enabled: z.boolean(),
  test_email_recipients: z.array(MailPulseRecipientSchema),
  test_phone_recipients: z.array(MailPulseRecipientSchema),
  inbound_secret: z.string().optional(),
})
export type MailPulseConfigForm = z.infer<typeof MailPulseConfigFormSchema>

/** Résultat d'un envoi de test individuel. */
export const MailPulseTestResultSchema = z.object({
  channel: z.enum(["email", "whatsapp"]),
  recipient: z.string(),
  ok: z.boolean(),
  status: z.string(),
  error_code: z.string().nullable(),
  error_message: z.string().nullable(),
})
export type MailPulseTestResult = z.infer<typeof MailPulseTestResultSchema>

/** Réponse POST /admin/settings/mailpulse/test. */
export const MailPulseTestResponseSchema = z.object({
  dry_run: z.boolean(),
  event: z.string(),
  sent: z.number(),
  results: z.array(MailPulseTestResultSchema),
  message: z.string(),
})
export type MailPulseTestResponse = z.infer<typeof MailPulseTestResponseSchema>

export type MailPulseEvent =
  | "payment_received"
  | "absence_reported"
  | "grade_published"
  | "fee_reminder"
export type MailPulseTestChannel = "email" | "whatsapp" | "both"

export interface MailPulseTestRequest {
  event: MailPulseEvent
  channel: MailPulseTestChannel
  dry_run: boolean
}

export const MAILPULSE_EVENTS: { value: MailPulseEvent; label: string }[] = [
  { value: "payment_received", label: "Paiement reçu" },
  { value: "absence_reported", label: "Absence signalée" },
  { value: "grade_published", label: "Note publiée" },
  { value: "fee_reminder", label: "Rappel de frais" },
]

export const MAILPULSE_CHANNELS: { value: MailPulseTestChannel; label: string }[] = [
  { value: "both", label: "Email + WhatsApp" },
  { value: "email", label: "Email seulement" },
  { value: "whatsapp", label: "WhatsApp seulement" },
]
