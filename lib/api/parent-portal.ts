import { apiFetch, apiFetchBlob, safeValidate } from "./client"
import {
  ParentDashboardSchema,
  ParentChildGradesResponseSchema,
  ParentChildFeesResponseSchema,
  ParentChildBulletinsResponseSchema,
  type ParentDashboard,
  type ParentChildGradesResponse,
  type ParentChildFeesResponse,
  type ParentChildBulletinsResponse,
} from "@/lib/contracts/parent-portal"

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

  // Frais d'un enfant
  getChildFees: async (childId: number): Promise<ParentChildFeesResponse> => {
    const res = await apiFetch<unknown>(`/parent/children/${childId}/fees`)
    return safeValidate(ParentChildFeesResponseSchema, unwrapResponse(res), `GET /parent/children/${childId}/fees`)
  },

  // Bulletins d'un enfant
  getChildBulletins: async (childId: number): Promise<ParentChildBulletinsResponse> => {
    const res = await apiFetch<unknown>(`/parent/children/${childId}/bulletins`)
    return safeValidate(ParentChildBulletinsResponseSchema, unwrapResponse(res), `GET /parent/children/${childId}/bulletins`)
  },

  // Télécharger un bulletin en PDF
  downloadChildBulletinPdf: async (bulletinId: number): Promise<Blob> => {
    return apiFetchBlob(`/reports/bulletins/${bulletinId}/pdf`)
  },

  // Emploi du temps d'un enfant
  getChildTimetable: async (childId: number): Promise<ChildTimetableResponse> => {
    const res = await apiFetch<unknown>(`/parent/children/${childId}/timetable`)
    return unwrapResponse(res) as ChildTimetableResponse
  },
}
