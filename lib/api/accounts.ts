import { apiFetch, safeValidate } from "./client"
import {
  AccountActionSchema,
  AccountStatusSchema,
  type AccountAction,
  type AccountEntityType,
  type AccountStatus,
} from "@/lib/contracts/account"

function unwrap(json: unknown): unknown {
  if (json !== null && typeof json === "object") {
    const obj = json as Record<string, unknown>
    if (obj.data !== undefined) return obj.data
  }
  return json
}

export const accountsApi = {
  get: async (
    entityType: AccountEntityType,
    entityId: number,
  ): Promise<AccountStatus> => {
    const json = await apiFetch<unknown>(`/admin/accounts/${entityType}/${entityId}`)
    return safeValidate(
      AccountStatusSchema,
      unwrap(json),
      `GET /admin/accounts/${entityType}/${entityId}`,
    )
  },

  create: async (
    entityType: AccountEntityType,
    entityId: number,
    email: string,
  ): Promise<AccountAction> => {
    const json = await apiFetch<unknown>(`/admin/accounts/${entityType}/${entityId}`, {
      method: "POST",
      body: JSON.stringify({ email }),
    })
    return safeValidate(
      AccountActionSchema,
      unwrap(json),
      `POST /admin/accounts/${entityType}/${entityId}`,
    )
  },

  resetPassword: async (
    entityType: AccountEntityType,
    entityId: number,
  ): Promise<AccountAction> => {
    const json = await apiFetch<unknown>(
      `/admin/accounts/${entityType}/${entityId}/reset-password`,
      { method: "POST" },
    )
    return safeValidate(
      AccountActionSchema,
      unwrap(json),
      `POST /admin/accounts/${entityType}/${entityId}/reset-password`,
    )
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string,
  ): Promise<void> => {
    await apiFetch<unknown>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    })
  },
}
