import { apiFetch, safeValidate } from "./client"
import {
  MailPulseConfigSchema,
  MailPulseTestResponseSchema,
  type MailPulseConfig,
  type MailPulseConfigForm,
  type MailPulseTestRequest,
  type MailPulseTestResponse,
} from "@/lib/contracts/mailpulse"

function unwrap(json: unknown): unknown {
  if (json !== null && typeof json === "object" && "data" in json) {
    const data = (json as { data?: unknown }).data
    if (data !== undefined) return data
  }
  return json
}

export const mailpulseApi = {
  get: async (): Promise<MailPulseConfig> => {
    const json = await apiFetch<unknown>("/admin/settings/mailpulse")
    return safeValidate(MailPulseConfigSchema, unwrap(json), "GET /admin/settings/mailpulse")
  },

  update: async (data: MailPulseConfigForm): Promise<MailPulseConfig> => {
    const json = await apiFetch<unknown>("/admin/settings/mailpulse", {
      method: "PUT",
      body: JSON.stringify(data),
    })
    return safeValidate(MailPulseConfigSchema, unwrap(json), "PUT /admin/settings/mailpulse")
  },

  test: async (data: MailPulseTestRequest): Promise<MailPulseTestResponse> => {
    const json = await apiFetch<unknown>("/admin/settings/mailpulse/test", {
      method: "POST",
      body: JSON.stringify(data),
    })
    return safeValidate(
      MailPulseTestResponseSchema,
      unwrap(json),
      "POST /admin/settings/mailpulse/test",
    )
  },
}
