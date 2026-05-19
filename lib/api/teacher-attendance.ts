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
  list: async (
    teacherId: number,
    params: TeacherAttendanceListParams = {},
  ): Promise<TeacherAttendanceListResponse> => {
    const json = await apiFetch<unknown>(
      `/admin/teachers/${teacherId}/attendance${toQueryString(params)}`,
    )
    return safeValidate(
      TeacherAttendanceListResponseSchema,
      unwrap(json),
      `GET /admin/teachers/${teacherId}/attendance`,
    )
  },

  stats: async (
    teacherId: number,
    academicYearId?: number,
  ): Promise<TeacherAttendanceStats> => {
    const qs =
      academicYearId !== undefined ? `?academic_year_id=${academicYearId}` : ""
    const json = await apiFetch<unknown>(
      `/admin/teachers/${teacherId}/attendance/stats${qs}`,
    )
    return safeValidate(
      TeacherAttendanceStatsSchema,
      unwrap(json),
      `GET /admin/teachers/${teacherId}/attendance/stats`,
    )
  },

  recordAsAdmin: async (
    teacherId: number,
    data: TeacherAttendanceCreate,
  ): Promise<TeacherAttendanceResponse> => {
    const json = await apiFetch<unknown>(
      `/admin/teachers/${teacherId}/attendance`,
      { method: "POST", body: JSON.stringify(data) },
    )
    return safeValidate(
      TeacherAttendanceResponseSchema,
      unwrap(json),
      `POST /admin/teachers/${teacherId}/attendance`,
    )
  },

  validate: async (
    attendanceId: number,
    data: TeacherAttendanceValidateInput,
  ): Promise<TeacherAttendanceResponse> => {
    const json = await apiFetch<unknown>(
      `/admin/teacher-attendance/${attendanceId}/validate`,
      { method: "PATCH", body: JSON.stringify(data) },
    )
    return safeValidate(
      TeacherAttendanceResponseSchema,
      unwrap(json),
      `PATCH /admin/teacher-attendance/${attendanceId}/validate`,
    )
  },

  delete: async (attendanceId: number): Promise<void> => {
    await apiFetch<unknown>(`/admin/teacher-attendance/${attendanceId}`, {
      method: "DELETE",
    })
  },

  selfDeclare: async (
    data: TeacherSelfDeclareCreate,
  ): Promise<TeacherAttendanceResponse> => {
    const json = await apiFetch<unknown>("/teacher/attendance/self-declare", {
      method: "POST",
      body: JSON.stringify(data),
    })
    return safeValidate(
      TeacherAttendanceResponseSchema,
      unwrap(json),
      "POST /teacher/attendance/self-declare",
    )
  },
}
