import { z } from "zod"
import { apiFetch, apiFetchBlob, safeValidate } from "./client"
import {
  BulletinSchema,
  type Bulletin,
  type BulletinListParams,
  type BulletinGenerate,
} from "@/lib/contracts/bulletin"

const BulletinArraySchema = z.array(BulletinSchema)
const BulletinListResponseSchema = z.object({
  items: BulletinArraySchema,
  total: z.number(),
})

export interface BulletinListResult {
  items: Bulletin[]
  total: number
  page: number
  size: number
}

export interface BulletinGenerateResult {
  message: string
  generated: number
  bulletins: Bulletin[]
}

export interface BulletinPublishResult {
  message: string
  count: number
}

export const bulletinsApi = {
  list: async (params: BulletinListParams = {}): Promise<BulletinListResult> => {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    ).toString()
    const json = await apiFetch<unknown>(
      `/reports/bulletins${query ? `?${query}` : ""}`,
    )
    const validated = safeValidate(BulletinListResponseSchema, json, "GET /reports/bulletins")
    return {
      ...validated,
      page: 1,
      size: validated.items.length || 1,
    }
  },

  getById: async (id: number): Promise<Bulletin> => {
    const json = await apiFetch<unknown>(`/reports/bulletins/${id}`)
    return safeValidate(BulletinSchema, json, `GET /reports/bulletins/${id}`)
  },

  generate: async (data: BulletinGenerate): Promise<BulletinGenerateResult> => {
    return apiFetch("/reports/bulletins/generate", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  publish: async (
    classId: number,
    trimester: number,
    academicYearId: number,
  ): Promise<BulletinPublishResult> => {
    const query = new URLSearchParams({
      class_id: String(classId),
      trimester: String(trimester),
      academic_year_id: String(academicYearId),
    }).toString()
    return apiFetch(`/reports/bulletins/publish?${query}`, {
      method: "POST",
    })
  },

  downloadPdf: async (id: number): Promise<Blob> => {
    return apiFetchBlob(`/reports/bulletins/${id}/pdf`)
  },
}
