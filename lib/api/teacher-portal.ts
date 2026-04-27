import { z } from "zod"
import { apiFetch, safeValidate } from "./client"
import {
  TeacherDashboardSchema,
  TeacherClassSchema,
  TeacherClassAttendanceStatsSchema,
  TeacherUpcomingEvalSchema,
  type TeacherDashboard,
  type TeacherClass,
  type TeacherClassAttendanceStats,
  type TeacherUpcomingEval,
} from "@/lib/contracts/teacher-portal"

const TeacherClassArraySchema = z.array(TeacherClassSchema)
const TeacherEvalsArraySchema = z.array(TeacherUpcomingEvalSchema)

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

  // Liste exhaustive des évaluations du prof connecté (pour la page Mes évaluations)
  getEvaluations: async (): Promise<TeacherUpcomingEval[]> => {
    const res = await apiFetch<unknown>("/teacher/evaluations")
    const arr = Array.isArray(res) ? res : unwrapResponse<TeacherUpcomingEval[]>(res)
    return safeValidate(TeacherEvalsArraySchema, arr, "GET /teacher/evaluations")
  },
}
