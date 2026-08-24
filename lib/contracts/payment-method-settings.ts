import { z } from "zod"
import { SELECTABLE_PAYMENT_METHODS } from "@/lib/payment-methods"

// Miroir de `app/schemas/payment_method_settings.py`.

/** Un moyen de paiement tel que l'écran de paramètres doit le présenter. */
export const PaymentMethodDescriptorSchema = z.object({
  key: z.enum([...SELECTABLE_PAYMENT_METHODS]),
  label: z.string(),
  /**
   * Vrai pour les espèces seulement. L'écran s'en sert pour avertir
   * qu'autoriser ce moyen engage une journée de caisse à ouvrir et à compter.
   */
  requires_cash_drawer: z.boolean(),
})

/** Ce qu'un profil qui encaisse a le droit de saisir. */
export const PaymentMethodRoleConfigSchema = z.object({
  role_id: z.number(),
  role_name: z.string(),
  role_label: z.string(),
  allowed_methods: z.array(z.enum([...SELECTABLE_PAYMENT_METHODS])),
})

export const PaymentMethodSettingsSchema = z.object({
  methods: z.array(PaymentMethodDescriptorSchema),
  roles: z.array(PaymentMethodRoleConfigSchema),
})

export type PaymentMethodDescriptor = z.infer<typeof PaymentMethodDescriptorSchema>
export type PaymentMethodRoleConfig = z.infer<typeof PaymentMethodRoleConfigSchema>
export type PaymentMethodSettings = z.infer<typeof PaymentMethodSettingsSchema>

export interface PaymentMethodSettingsUpdate {
  roles: { role_id: number; allowed_methods: string[] }[]
}
