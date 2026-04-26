import { z } from "zod"
import { apiFetch, safeValidate } from "./client"

// ---------- Inline types for backend response shapes ----------
// The contracts file is being updated by another agent with:
// SessionCreateSchema, SessionResponse, AttendanceRecordResponse,
// StudentAttendanceResponse, ClassAttendanceStats
// For now we define local schemas matching the actual backend.

const AttendanceRecordResponseSchema = z.object({
  id: z.number(),
  student_id: z.number(),
  status: z.enum(["present", "absent", "late", "excused"]),
  time_in: z.string().nullable(),
  time_out: z.string().nullable(),
  source: z.string(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

const SessionResponseSchema = z.object({
  id: z.number(),
  entity_type: z.string(),
  context_id: z.number(),
  date: z.string(),
  academic_year_id: z.number(),
  records: z.array(AttendanceRecordResponseSchema),
  created_at: z.string(),
  updated_at: z.string(),
})

const StudentAttendanceResponseSchema = z.object({
  items: z.array(AttendanceRecordResponseSchema),
  total: z.number(),
  page: z.number(),
  size: z.number(),
})

const StudentStatsSchema = z.object({
  student_id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  present_count: z.number(),
  absent_count: z.number(),
  late_count: z.number(),
  excused_count: z.number(),
  attendance_rate: z.number(),
})

const ClassAttendanceStatsSchema = z.object({
  class_id: z.number(),
  total_sessions: z.number(),
  attendance_rate: z.number(),
  students: z.array(StudentStatsSchema),
})

// ---------- Exported types ----------

export type AttendanceRecordResponse = z.infer<typeof AttendanceRecordResponseSchema>
export type SessionResponse = z.infer<typeof SessionResponseSchema>
export type StudentAttendanceResponse = z.infer<typeof StudentAttendanceResponseSchema>
export type ClassAttendanceStats = z.infer<typeof ClassAttendanceStatsSchema>

export interface SessionCreateRecord {
  student_id: number
  status: "present" | "absent" | "late" | "excused"
  time_in?: string | null
  notes?: string | null
}

export interface SessionCreatePayload {
  entity_type: string
  context_id: number
  date: string
  academic_year_id: number
  records: SessionCreateRecord[]
}

export interface SessionUpdatePayload {
  records: SessionCreateRecord[]
}

// ---------- API client ----------

export const attendanceApi = {
  // Créer une session de présence avec les enregistrements
  createSession: async (data: SessionCreatePayload): Promise<SessionResponse> => {
    const json = await apiFetch<SessionResponse>(
      `/attendance/sessions`,
      { method: "POST", body: JSON.stringify(data) },
    )
    return safeValidate(SessionResponseSchema, json, "POST /attendance/sessions")
  },

  // Mettre à jour les enregistrements d'une session existante
  updateSession: async (sessionId: number, data: SessionUpdatePayload): Promise<SessionResponse> => {
    const json = await apiFetch<SessionResponse>(
      `/attendance/sessions/${sessionId}`,
      { method: "PATCH", body: JSON.stringify(data) },
    )
    return safeValidate(SessionResponseSchema, json, `PATCH /attendance/sessions/${sessionId}`)
  },

  // Historique de présence d'un élève (paginé)
  getStudentHistory: async (
    studentId: number,
    params: { page?: number; size?: number } = {},
  ): Promise<StudentAttendanceResponse> => {
    const query = new URLSearchParams()
    if (params.page) query.set("page", String(params.page))
    if (params.size) query.set("size", String(params.size))
    const qs = query.toString()
    const json = await apiFetch<StudentAttendanceResponse>(
      `/attendance/student/${studentId}${qs ? `?${qs}` : ""}`,
    )
    return safeValidate(StudentAttendanceResponseSchema, json, `GET /attendance/student/${studentId}`)
  },

  // Récupérer une session par classe, créneau et date
  getSession: async (
    classId: number,
    slotId: number,
    date: string,
  ): Promise<SessionResponse> => {
    const query = new URLSearchParams({ class_id: String(classId), slot_id: String(slotId), date })
    const json = await apiFetch<SessionResponse>(
      `/attendance/sessions?${query}`,
    )
    return safeValidate(SessionResponseSchema, json, "GET /attendance/sessions")
  },

  // Historique de présence (paginé, filtrable)
  getHistory: async (
    params: Record<string, string | number | undefined>,
  ): Promise<StudentAttendanceResponse> => {
    const query = new URLSearchParams()
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== "") query.set(key, String(val))
    }
    const qs = query.toString()
    const json = await apiFetch<StudentAttendanceResponse>(
      `/attendance/history${qs ? `?${qs}` : ""}`,
    )
    return safeValidate(StudentAttendanceResponseSchema, json, "GET /attendance/history")
  },

  // Enregistrer un batch de présences (crée ou met à jour)
  saveBatch: async (
    classId: number,
    slotId: number,
    date: string,
    records: SessionCreateRecord[],
  ): Promise<SessionResponse> => {
    const json = await apiFetch<SessionResponse>(
      `/attendance/sessions`,
      {
        method: "POST",
        body: JSON.stringify({
          entity_type: "class",
          context_id: classId,
          slot_id: slotId,
          date,
          records,
        }),
      },
    )
    return safeValidate(SessionResponseSchema, json, "POST /attendance/sessions (batch)")
  },

  // Statistiques de présence pour une classe
  getClassStats: async (classId: number): Promise<ClassAttendanceStats> => {
    const json = await apiFetch<ClassAttendanceStats>(
      `/attendance/class/${classId}/stats`,
    )
    return safeValidate(ClassAttendanceStatsSchema, json, `GET /attendance/class/${classId}/stats`)
  },
}
