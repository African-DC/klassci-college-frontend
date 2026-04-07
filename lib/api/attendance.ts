import { z } from "zod"
import { apiFetch, safeValidate } from "./client"
import { PaginatedResponseSchema, type PaginatedResponse } from "@/lib/contracts"
import {
  AttendanceSessionSchema,
  AttendanceRecordSchema,
  AttendanceStatsSchema,
  type AttendanceSession,
  type AttendanceRecord,
  type AttendanceStats,
  type AttendanceBatchEntry,
} from "@/lib/contracts/attendance"

const AttendanceRecordArraySchema = z.array(AttendanceRecordSchema)
const AttendanceStatsArraySchema = z.array(AttendanceStatsSchema)
const PaginatedRecordsSchema = PaginatedResponseSchema(AttendanceRecordSchema)

export const attendanceApi = {
  // Récupérer la feuille de présence d'une session de cours
  getSession: async (classId: number, slotId: number, date: string): Promise<AttendanceSession> => {
    const params = new URLSearchParams({
      class_id: String(classId),
      slot_id: String(slotId),
      date,
    })
    const json = await apiFetch<{ data?: AttendanceSession } | AttendanceSession>(
      `/attendance/session?${params}`,
    )
    const session = (json as { data?: AttendanceSession }).data ?? (json as AttendanceSession)
    return safeValidate(AttendanceSessionSchema, session, "GET /attendance/session")
  },

  // Enregistrer le pointage en batch
  saveBatch: async (
    slotId: number,
    date: string,
    records: AttendanceBatchEntry[],
  ): Promise<AttendanceRecord[]> => {
    const json = await apiFetch<{ data?: AttendanceRecord[] } | AttendanceRecord[]>(
      `/attendance/batch`,
      {
        method: "POST",
        body: JSON.stringify({ slot_id: slotId, date, records }),
      },
    )
    const arr = Array.isArray(json) ? json : (json as { data?: AttendanceRecord[] }).data ?? []
    return safeValidate(AttendanceRecordArraySchema, arr, "POST /attendance/batch")
  },

  // Historique des présences avec filtres et pagination
  getHistory: async (params: Record<string, unknown> = {}): Promise<PaginatedResponse<AttendanceRecord>> => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        query.set(key, String(value))
      }
    })
    const json = await apiFetch<PaginatedResponse<AttendanceRecord> | AttendanceRecord[]>(
      `/attendance?${query}`,
    )
    if (Array.isArray(json)) {
      const data = safeValidate(AttendanceRecordArraySchema, json, "GET /attendance")
      return { items: data, total: data.length, page: 1, size: data.length }
    }
    return safeValidate(PaginatedRecordsSchema, json, "GET /attendance")
  },

  // Statistiques de présence par élève pour une classe
  getStats: async (classId: number): Promise<AttendanceStats[]> => {
    const json = await apiFetch<{ data?: AttendanceStats[] } | AttendanceStats[]>(
      `/attendance/stats?class_id=${classId}`,
    )
    const arr = Array.isArray(json) ? json : (json as { data?: AttendanceStats[] }).data ?? []
    return safeValidate(AttendanceStatsArraySchema, arr, "GET /attendance/stats")
  },
}
