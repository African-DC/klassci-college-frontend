import { z } from "zod"
import { apiFetch, apiFetchBlob, safeValidate } from "./client"
import { cashRemaining } from "@/lib/contracts/payment"
import { mapFeeStatus } from "./student-portal"
import {
  ParentDashboardSchema,
  ParentChildGradesResponseSchema,
  ParentChildBulletinsResponseSchema,
  type ParentDashboard,
  type ParentChildGradesResponse,
  type ParentChildFeesResponse,
  type ParentChildBulletinsResponse,
} from "@/lib/contracts/parent-portal"

// Le BE /parent/children/{id}/fees renvoie {student_id, enrollment_id,
// total_due, total_paid, fees:[{id, category_name, amount, status, payments}]}.
// On valide cette forme puis on la normalise vers le contrat UI.
const ParentFeeRawSchema = z.object({
  id: z.number(),
  category_name: z.string(),
  amount: z.coerce.number(),
  status: z.string(),
  payments: z.array(z.object({ amount: z.coerce.number() }).passthrough()).default([]),
})
const ParentChildFeesRawSchema = z.object({
  student_id: z.number(),
  enrollment_id: z.number().nullable().optional(),
  total_due: z.coerce.number(),
  total_paid: z.coerce.number(),
  fees: z.array(ParentFeeRawSchema).default([]),
})

export interface ChildTimetableSlot {
  id: number
  day: string
  start_time: string
  end_time: string
  subject_name: string
  teacher_name: string
  room_name: string | null
}

export interface ChildTimetableResponse {
  student_id: number
  class_name: string
  slots: ChildTimetableSlot[]
}

// Extrait l'item de la réponse API, qu'elle soit { data: T } ou T directement
function unwrapResponse<T>(res: unknown): T {
  if (res !== null && typeof res === "object" && "data" in res && (res as Record<string, unknown>).data !== undefined) {
    return (res as Record<string, unknown>).data as T
  }
  return res as T
}

export const parentPortalApi = {
  // Dashboard — résumé de tous les enfants
  getDashboard: async (): Promise<ParentDashboard> => {
    const res = await apiFetch<unknown>("/parent/dashboard")
    return safeValidate(ParentDashboardSchema, unwrapResponse(res), "GET /parent/dashboard")
  },

  // Notes d'un enfant par trimestre
  getChildGrades: async (childId: number, trimester?: string): Promise<ParentChildGradesResponse> => {
    const params = trimester ? `?${new URLSearchParams({ trimester })}` : ""
    const res = await apiFetch<unknown>(`/parent/children/${childId}/grades${params}`)
    return safeValidate(ParentChildGradesResponseSchema, unwrapResponse(res), `GET /parent/children/${childId}/grades`)
  },

  // Frais d'un enfant — normalise la réponse BE vers le contrat UI.
  getChildFees: async (childId: number): Promise<ParentChildFeesResponse> => {
    const res = await apiFetch<unknown>(`/parent/children/${childId}/fees`)
    const raw = safeValidate(ParentChildFeesRawSchema, unwrapResponse(res), `GET /parent/children/${childId}/fees`)
    const fees = (raw.fees ?? []).map((f) => {
      const paid = (f.payments ?? []).reduce((sum, p) => sum + p.amount, 0)
      return {
        id: f.id,
        category_name: f.category_name,
        total_amount: f.amount,
        paid_amount: paid,
        remaining: cashRemaining(f.status, f.amount, paid),
        status: mapFeeStatus(f.status),
        last_payment_date: null,
      }
    })
    return {
      child_name: null,
      class_name: null,
      academic_year: null,
      total_expected: raw.total_due,
      total_paid: raw.total_paid,
      total_remaining: fees.reduce((sum, f) => sum + f.remaining, 0),
      fees,
    }
  },

  // Bulletins d'un enfant
  getChildBulletins: async (childId: number): Promise<ParentChildBulletinsResponse> => {
    const res = await apiFetch<unknown>(`/parent/children/${childId}/bulletins`)
    return safeValidate(ParentChildBulletinsResponseSchema, unwrapResponse(res), `GET /parent/children/${childId}/bulletins`)
  },

  /**
   * Télécharger le bulletin d'un enfant en PDF.
   *
   * Passe par le portail parent, pas par `/reports/bulletins/{id}/pdf` :
   * cette route-là est gardée par `reports:read`, un droit qui ouvre les
   * bulletins de toute l'école et qu'un parent n'a pas. Le téléchargement
   * répondait donc 403 alors que le bulletin s'affichait bien. Ici, la garde
   * est le lien de filiation, d'où l'identifiant de l'enfant dans l'adresse.
   */
  downloadChildBulletinPdf: async (childId: number, bulletinId: number): Promise<Blob> => {
    return apiFetchBlob(`/parent/children/${childId}/bulletins/${bulletinId}/pdf`)
  },

  // Emploi du temps d'un enfant
  getChildTimetable: async (childId: number): Promise<ChildTimetableResponse> => {
    const res = await apiFetch<unknown>(`/parent/children/${childId}/timetable`)
    return unwrapResponse(res) as ChildTimetableResponse
  },
}
