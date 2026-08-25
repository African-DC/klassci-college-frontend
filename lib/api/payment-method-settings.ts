import { apiFetch, safeValidate } from "./client"
import {
  PaymentMethodSettingsSchema,
  type PaymentMethodSettings,
  type PaymentMethodSettingsUpdate,
} from "@/lib/contracts/payment-method-settings"

export const paymentMethodSettingsApi = {
  get: async (): Promise<PaymentMethodSettings> => {
    const json = await apiFetch<unknown>("/admin/payment-methods")
    return safeValidate(PaymentMethodSettingsSchema, json, "GET /admin/payment-methods")
  },

  update: async (data: PaymentMethodSettingsUpdate): Promise<PaymentMethodSettings> => {
    const json = await apiFetch<unknown>("/admin/payment-methods", {
      method: "PUT",
      body: JSON.stringify(data),
    })
    return safeValidate(PaymentMethodSettingsSchema, json, "PUT /admin/payment-methods")
  },
}
