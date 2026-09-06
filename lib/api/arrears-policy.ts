import { apiFetch, safeValidate } from "./client"
import {
  ArrearsPolicySettingsSchema,
  type ArrearsPolicySettings,
  type ArrearsPolicyUpdate,
} from "@/lib/contracts/arrears-policy"

/**
 * La politique de l'établissement sur les dettes d'un exercice précédent.
 *
 * Endpoint dédié, gardé par `admin:fee-categories:read` en lecture et
 * `admin:fee-categories:update` en écriture — le droit « je fixe les règles
 * d'argent de cette école ».
 */
export const arrearsPolicyApi = {
  get: async (): Promise<ArrearsPolicySettings> => {
    const json = await apiFetch<unknown>("/admin/arrears-policy")
    return safeValidate(ArrearsPolicySettingsSchema, json, "GET /admin/arrears-policy")
  },

  update: async (data: ArrearsPolicyUpdate): Promise<ArrearsPolicySettings> => {
    const json = await apiFetch<unknown>("/admin/arrears-policy", {
      method: "PUT",
      body: JSON.stringify(data),
    })
    return safeValidate(ArrearsPolicySettingsSchema, json, "PUT /admin/arrears-policy")
  },
}
