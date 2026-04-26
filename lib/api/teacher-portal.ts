import { z } from "zod"
import { apiFetch, safeValidate } from "./client"
import {
  TeacherDashboardSchema,
  TeacherClassSchema,
  TeacherClassAttendanceStatsSchema,
  type TeacherDashboard,
  type TeacherClass,
  type TeacherClassAttendanceStats,
} from "@/lib/contracts/teacher-portal"

const TeacherClassArraySchema = z.array(TeacherClassSchema)

// Extrait l'item de la réponse API, qu'elle soit { data: T } ou T directement
function unwrapResponse<T>(res: unknown): T {
  if (res !== null && typeof res === "object" && "data" in res && (res as Record<string, unknown>).data !== undefined) {
    return (res as Record<string, unknown>).data as T
  }
  return res as T
}

export const teacherPortalApi = {
  // Dashboard — KPIs, prochain cours, évaluations à venir
  getDashboard: async (): Promise<TeacherDashboard> => {
    const res = await apiFetch<unknown>("/teacher/dashboard")
    return safeValidate(TeacherDashboardSchema, unwrapResponse(res), "GET /teacher/dashboard")
  },

  // Liste des classes assignées avec stats
  getClasses: async (): Promise<TeacherClass[]> => {
    const res = await apiFetch<unknown>("/teacher/classes")
    const arr = Array.isArray(res) ? res : unwrapResponse<TeacherClass[]>(res)
    return safeValidate(TeacherClassArraySchema, arr, "GET /teacher/classes")
  },

  // Stats de présence pour une classe
  getClassAttendance: async (classId: number): Promise<TeacherClassAttendanceStats> => {
    const res = await apiFetch<unknown>(`/teacher/classes/${classId}/attendance`)
    return safeValidate(TeacherClassAttendanceStatsSchema, unwrapResponse(res), `GET /teacher/classes/${classId}/attendance`)
  },
}
