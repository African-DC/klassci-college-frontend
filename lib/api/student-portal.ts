import { z } from "zod"
import { apiFetch, apiFetchBlob, safeValidate } from "./client"
import {
  StudentDashboardSchema,
  StudentGradesResponseSchema,
  StudentFeesResponseSchema,
  StudentBulletinSchema,
  StudentAttendanceResponseSchema,
  type StudentDashboard,
  type StudentGradesResponse,
  type StudentFeesResponse,
  type StudentBulletin,
  type StudentAttendanceResponse,
} from "@/lib/contracts/student-portal"
import {
  TimetableSlotSchema,
  type TimetableSlot,
} from "@/lib/contracts/timetable"

const TimetableSlotArraySchema = z.array(TimetableSlotSchema)
const StudentBulletinArraySchema = z.array(StudentBulletinSchema)

// Extrait l'item de la réponse API, qu'elle soit { data: T } ou T directement
function unwrapResponse<T>(res: unknown): T {
  if (res !== null && typeof res === "object" && "data" in res && (res as Record<string, unknown>).data !== undefined) {
    return (res as Record<string, unknown>).data as T
  }
  return res as T
}

export const studentPortalApi = {
  // Dashboard — KPIs et prochain cours
  getDashboard: async (): Promise<StudentDashboard> => {
    const res = await apiFetch<unknown>("/student/dashboard")
    return safeValidate(StudentDashboardSchema, unwrapResponse(res), "GET /student/dashboard")
  },

  // Notes par matière et trimestre
  getGrades: async (trimester?: string): Promise<StudentGradesResponse> => {
    const query = trimester ? `?${new URLSearchParams({ trimester })}` : ""
    const res = await apiFetch<unknown>(`/student/grades${query}`)
    return safeValidate(StudentGradesResponseSchema, unwrapResponse(res), "GET /student/grades")
  },

  // Emploi du temps de la classe de l'élève
  getTimetable: async (): Promise<TimetableSlot[]> => {
    const res = await apiFetch<unknown>("/student/timetable")
    const arr = Array.isArray(res) ? res : unwrapResponse<TimetableSlot[]>(res)
    return safeValidate(TimetableSlotArraySchema, arr, "GET /student/timetable")
  },

  // Frais et paiements
  getFees: async (): Promise<StudentFeesResponse> => {
    const res = await apiFetch<unknown>("/student/fees")
    return safeValidate(StudentFeesResponseSchema, unwrapResponse(res), "GET /student/fees")
  },

  // Bulletins publiés
  getBulletins: async (): Promise<StudentBulletin[]> => {
    const res = await apiFetch<unknown>("/student/bulletins")
    const arr = Array.isArray(res) ? res : unwrapResponse<StudentBulletin[]>(res)
    return safeValidate(StudentBulletinArraySchema, arr, "GET /student/bulletins")
  },

  // Télécharger un bulletin en PDF (via apiFetchBlob centralisé)
  downloadBulletin: async (bulletinId: number): Promise<Blob> => {
    return apiFetchBlob(`/student/bulletins/${bulletinId}/pdf`)
  },

  // Historique de présence
  getAttendance: async (params?: { status?: string; page?: number }): Promise<StudentAttendanceResponse> => {
    const query = new URLSearchParams()
    if (params?.status) query.set("status", params.status)
    if (params?.page) query.set("page", String(params.page))
    const qs = query.toString()
    const res = await apiFetch<unknown>(`/student/attendance${qs ? `?${qs}` : ""}`)
    return safeValidate(StudentAttendanceResponseSchema, unwrapResponse(res), "GET /student/attendance")
  },
}
