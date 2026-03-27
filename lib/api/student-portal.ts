import { z } from "zod"
import { getSession } from "next-auth/react"
import { apiFetch, safeValidate } from "./client"
import {
  StudentDashboardSchema,
  StudentGradesResponseSchema,
  StudentFeesResponseSchema,
  StudentBulletinSchema,
  type StudentDashboard,
  type StudentGradesResponse,
  type StudentFeesResponse,
  type StudentBulletin,
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
    const params = trimester ? `?trimester=${trimester}` : ""
    const res = await apiFetch<unknown>(`/student/grades${params}`)
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

  // Télécharger un bulletin en PDF
  downloadBulletin: async (bulletinId: number): Promise<Blob> => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL
    if (!baseUrl) throw new Error("NEXT_PUBLIC_API_URL is not defined")
    const session = await getSession()
    if (!session?.accessToken) throw new Error("Session expirée — veuillez vous reconnecter")
    const res = await fetch(`${baseUrl}/student/bulletins/${bulletinId}/pdf`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    })
    if (!res.ok) throw new Error("Impossible de télécharger le bulletin")
    return res.blob()
  },
}
