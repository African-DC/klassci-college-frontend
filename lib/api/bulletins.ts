import { z } from "zod"
import { getSession } from "next-auth/react"
import { apiFetch, safeValidate } from "./client"
import {
  BulletinSchema,
  type Bulletin,
  type BulletinListParams,
  type BulletinGenerate,
} from "@/lib/contracts/bulletin"
import { PaginatedResponseSchema, type PaginatedResponse } from "@/lib/contracts"

const PaginatedBulletinSchema = PaginatedResponseSchema(BulletinSchema)
const BulletinArraySchema = z.array(BulletinSchema)

export const bulletinsApi = {
  list: async (params: BulletinListParams = {}): Promise<PaginatedResponse<Bulletin>> => {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    ).toString()
    const json = await apiFetch<PaginatedResponse<Bulletin> | Bulletin[]>(
      `/bulletins${query ? `?${query}` : ""}`,
    )
    if (Array.isArray(json)) {
      const arr = safeValidate(BulletinArraySchema, json, "GET /bulletins")
      return { data: arr, total: arr.length, page: 1, per_page: arr.length, total_pages: 1 }
    }
    return safeValidate(PaginatedBulletinSchema, json, "GET /bulletins")
  },

  getById: async (id: number): Promise<Bulletin> => {
    const json = await apiFetch<{ data?: Bulletin } | Bulletin>(`/bulletins/${id}`)
    const bulletin = (json as { data?: Bulletin }).data ?? (json as Bulletin)
    return safeValidate(BulletinSchema, bulletin, `GET /bulletins/${id}`)
  },

  generate: async (data: BulletinGenerate): Promise<{ message: string; count: number }> => {
    return apiFetch("/bulletins/generate", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  publish: async (classId: number, trimester: string): Promise<{ message: string; count: number }> => {
    return apiFetch("/bulletins/publish", {
      method: "POST",
      body: JSON.stringify({ class_id: classId, trimester }),
    })
  },

  downloadPdf: async (id: number): Promise<Blob> => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL
    if (!baseUrl) throw new Error("NEXT_PUBLIC_API_URL is not defined")
    const session = await getSession()
    if (!session?.accessToken) throw new Error("Non authentifié")
    const res = await fetch(`${baseUrl}/bulletins/${id}/pdf`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    })
    if (!res.ok) throw new Error("Impossible de télécharger le bulletin")
    return res.blob()
  },
}
