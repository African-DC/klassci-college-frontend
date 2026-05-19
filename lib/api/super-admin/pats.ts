import { apiFetch } from "@/lib/api/client"
import {
  type PATCreateResponse,
  patCreateResponseSchema,
  patListResponseSchema,
} from "@/lib/contracts/super-admin"
import type { z } from "zod"

type PATListResponse = z.infer<typeof patListResponseSchema>

export const patsApi = {
  list: async (): Promise<PATListResponse> => {
    return apiFetch<PATListResponse>("/super-admin/pats", {
      schema: patListResponseSchema,
    })
  },

  create: async (data: {
    name: string
    scopes: string[]
    expires_in_days?: number
  }): Promise<PATCreateResponse> => {
    return apiFetch<PATCreateResponse>("/super-admin/pats", {
      method: "POST",
      body: JSON.stringify(data),
      schema: patCreateResponseSchema,
    })
  },

  revoke: async (id: number): Promise<void> => {
    await apiFetch<void>(`/super-admin/pats/${id}`, { method: "DELETE" })
  },
}
