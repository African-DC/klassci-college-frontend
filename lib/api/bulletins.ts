import { z } from "zod"
import { apiFetch, apiFetchBlob, safeValidate } from "./client"
import {
  BulletinSchema,
  type Bulletin,
  type BulletinListParams,
  type BulletinGenerate,
} from "@/lib/contracts/bulletin"

const BulletinArraySchema = z.array(BulletinSchema)
/**
 * Enveloppe paginée. `total` porte le compte de l'école pour les filtres
 * demandés : le pied de liste et le pagineur le lisent ici, jamais en
 * comptant `items`, qui ne décrit que la page rendue.
 */
const BulletinListResponseSchema = z.object({
  items: BulletinArraySchema,
  total: z.number(),
  page: z.number(),
  size: z.number(),
})

export interface BulletinListResult {
  items: Bulletin[]
  total: number
  page: number
  size: number
}

/**
 * Une classe compte au plus une quarantaine d'élèves : ce format tient un
 * niveau entier sur une page, tout en restant sous le plafond du backend.
 */
export const BULLETINS_PAGE_SIZE = 50

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
      Object.entries({ size: BULLETINS_PAGE_SIZE, ...params })
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    ).toString()
    const json = await apiFetch<unknown>(
      `/reports/bulletins${query ? `?${query}` : ""}`,
    )
    return safeValidate(BulletinListResponseSchema, json, "GET /reports/bulletins")
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

  /**
   * Le bulletin est retenu quand la famille est en retard sur son échéancier.
   * `overrideReason` lève la retenue, à condition d'avoir le droit de déroger.
   */
  downloadPdf: async (id: number, overrideReason?: string): Promise<Blob> => {
    const reason = overrideReason?.trim()
    const query = reason ? `?override_reason=${encodeURIComponent(reason)}` : ""
    return apiFetchBlob(`/reports/bulletins/${id}/pdf${query}`)
  },
}
