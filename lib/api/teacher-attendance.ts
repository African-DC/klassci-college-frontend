import { z } from "zod"
import { apiFetch, safeValidate } from "./client"
import {
  TeacherAttendanceListResponseSchema,
  TeacherAttendanceResponseSchema,
  TeacherAttendanceStatsSchema,
  type TeacherAttendanceCreate,
  type TeacherAttendanceListResponse,
  type TeacherAttendanceResponse,
  type TeacherAttendanceStats,
  type TeacherAttendanceValidateInput,
  type TeacherSelfDeclareCreate,
} from "@/lib/contracts/teacher-attendance"

function unwrap(json: unknown): unknown {
  if (json !== null && typeof json === "object") {
    const obj = json as Record<string, unknown>
    if (obj.data !== undefined) return obj.data
  }
  return json
}

async function fetchAndValidate<T>(
  schema: z.ZodType<T>,
  path: string,
  context: string,
  init?: { method?: string; body?: string },
): Promise<T> {
  const json = await apiFetch<unknown>(path, init)
  return safeValidate(schema, unwrap(json), context)
}

export interface TeacherAttendanceListParams {
  academic_year_id?: number
  status?: string
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
}

function toQueryString(params: TeacherAttendanceListParams): string {
  const query = new URLSearchParams()
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== "") query.set(key, String(val))
  }
  const qs = query.toString()
  return qs ? `?${qs}` : ""
}

export const teacherAttendanceApi = {
  list: (
    teacherId: number,
    params: TeacherAttendanceListParams = {},
  ): Promise<TeacherAttendanceListResponse> => {
    const path = `/admin/teachers/${teacherId}/attendance${toQueryString(params)}`
    return fetchAndValidate(TeacherAttendanceListResponseSchema, path, `GET ${path}`)
  },

  stats: (
    teacherId: number,
    academicYearId?: number,
  ): Promise<TeacherAttendanceStats> => {
    const qs = academicYearId !== undefined ? `?academic_year_id=${academicYearId}` : ""
    const path = `/admin/teachers/${teacherId}/attendance/stats${qs}`
    return fetchAndValidate(TeacherAttendanceStatsSchema, path, `GET ${path}`)
  },

  recordAsAdmin: (
    teacherId: number,
    data: TeacherAttendanceCreate,
  ): Promise<TeacherAttendanceResponse> => {
    const path = `/admin/teachers/${teacherId}/attendance`
    return fetchAndValidate(TeacherAttendanceResponseSchema, path, `POST ${path}`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  validate: (
    attendanceId: number,
    data: TeacherAttendanceValidateInput,
  ): Promise<TeacherAttendanceResponse> => {
    const path = `/admin/teacher-attendance/${attendanceId}/validate`
    return fetchAndValidate(TeacherAttendanceResponseSchema, path, `PATCH ${path}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  delete: async (attendanceId: number): Promise<void> => {
    await apiFetch<unknown>(`/admin/teacher-attendance/${attendanceId}`, {
      method: "DELETE",
    })
  },

  selfDeclare: (
    data: TeacherSelfDeclareCreate,
  ): Promise<TeacherAttendanceResponse> => {
    const path = "/teacher/attendance/self-declare"
    return fetchAndValidate(TeacherAttendanceResponseSchema, path, `POST ${path}`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },
}
