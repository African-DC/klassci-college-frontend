import { z } from "zod"
import { getSession } from "next-auth/react"
import { apiFetch, safeValidate } from "./client"
import {
  TimetableSlotSchema,
  GenerateTaskResponseSchema,
  TeacherAvailabilitySchema,
  TeacherWeekSchema,
  type TimetableSlot,
  type TimetableSlotCreate,
  type TimetableSlotUpdate,
  type GenerateTaskResponse,
  type TeacherAvailability,
  type TeacherAvailabilityCreate,
  type TeacherAvailabilityUpdate,
  type TeacherWeek,
  type TimetableDiagnostic,
} from "@/lib/contracts/timetable"

export type {
  TimetableSlot,
  TimetableSlotCreate,
  TimetableSlotUpdate,
  GenerateTaskResponse,
  TeacherAvailability,
  TeacherAvailabilityCreate,
  TeacherAvailabilityUpdate,
}

const TimetableSlotArraySchema = z.array(TimetableSlotSchema)
const TeacherAvailabilityArraySchema = z.array(TeacherAvailabilitySchema)

// Day translation: FE uses French, BE uses English
const FR_TO_EN: Record<string, string> = {
  lundi: "monday", mardi: "tuesday", mercredi: "wednesday",
  jeudi: "thursday", vendredi: "friday", samedi: "saturday",
}
const EN_TO_FR: Record<string, string> = {
  monday: "lundi", tuesday: "mardi", wednesday: "mercredi",
  thursday: "jeudi", friday: "vendredi", saturday: "samedi",
}
function dayToEn(day: string): string { return FR_TO_EN[day] ?? day }
function dayToFr<D extends string>(day: D): D { return (EN_TO_FR[day] ?? day) as D }
function slotsToFr<T extends { day: string }>(slots: T[]): T[] {
  return slots.map((s) => ({ ...s, day: dayToFr(s.day) }))
}

export const timetableApi = {
  listByClass: async (classId: number): Promise<TimetableSlot[]> => {
    const params = new URLSearchParams({ class_id: String(classId) })
    const json = await apiFetch<{ data?: TimetableSlot[] } | TimetableSlot[]>(
      `/timetable?${params}`,
    )
    const arr = Array.isArray(json) ? json : json.data ?? []
    return slotsToFr(safeValidate(TimetableSlotArraySchema, arr, `/timetable?class_id=${classId}`))
  },

  listByTeacher: async (teacherId: number): Promise<TimetableSlot[]> => {
    const json = await apiFetch<{ data?: TimetableSlot[] } | TimetableSlot[]>(
      `/timetable?teacher_id=${teacherId}`,
    )
    const arr = Array.isArray(json) ? json : json.data ?? []
    return slotsToFr(safeValidate(TimetableSlotArraySchema, arr, `/timetable?teacher_id=${teacherId}`))
  },

  // GET /teacher/schedule (BE) resolves the teacher from the JWT, so the FE
  // never needs to know the teacher_profile.id. Used for /teacher/timetable
  // (the teacher viewing their own schedule). The shape from BE omits a few
  // fields that TimetableSlotSchema requires (teacher_id / teacher_name /
  // class_id / academic_year_id / subject_id) — we map to a synthesized
  // record that satisfies the Zod contract used by the grid component.
  myTimetable: async (): Promise<TimetableSlot[]> => {
    const json = await apiFetch<{ items?: unknown[] } | unknown[]>(`/teacher/schedule`)
    const arr: unknown[] = Array.isArray(json) ? json : json.items ?? []
    const mapped = arr.map((raw) => {
      const s = raw as Record<string, unknown>
      const start = String(s.start_time ?? "").slice(0, 5)
      const end = String(s.end_time ?? "").slice(0, 5)
      const id = Number(s.id ?? 0)
      return {
        id,
        class_id: Number(s.class_id ?? 0),
        teacher_id: Number(s.teacher_id ?? 0),
        // subject_id drives the color hue in TeacherScheduleView. /teacher/schedule
        // doesn't expose it, so we fall back to the slot id which is unique enough
        // to spread colors across slots of the same teacher.
        subject_id: Number(s.subject_id ?? id),
        academic_year_id: Number(s.academic_year_id ?? 0),
        day: String(s.day ?? ""),
        start_time: start,
        end_time: end,
        class_name: String(s.class_name ?? ""),
        teacher_name: String(s.teacher_name ?? ""),
        subject_name: String(s.subject_name ?? ""),
        subject_color: (s.subject_color as string | null | undefined) ?? null,
        room: ((s.room ?? s.room_name) as string | null | undefined) ?? null,
      }
    })
    return slotsToFr(safeValidate(TimetableSlotArraySchema, mapped, `/teacher/schedule`))
  },

  create: async (data: TimetableSlotCreate): Promise<TimetableSlot> => {
    const payload = { ...data, day: dayToEn(data.day) }
    const json = await apiFetch<{ data?: TimetableSlot } | TimetableSlot>(
      `/timetable/slots`,
      { method: "POST", body: JSON.stringify(payload) },
    )
    const slot = (json as { data?: TimetableSlot }).data ?? (json as TimetableSlot)
    const validated = safeValidate(TimetableSlotSchema, slot, "POST /timetable/slots")
    return { ...validated, day: dayToFr(validated.day) }
  },

  update: async (id: number, data: TimetableSlotUpdate): Promise<TimetableSlot> => {
    const payload = { ...data, ...(data.day && { day: dayToEn(data.day) }) }
    const json = await apiFetch<{ data?: TimetableSlot } | TimetableSlot>(
      `/timetable/slots/${id}`,
      { method: "PATCH", body: JSON.stringify(payload) },
    )
    const slot = (json as { data?: TimetableSlot }).data ?? (json as TimetableSlot)
    const validated = safeValidate(TimetableSlotSchema, slot, `PATCH /timetable/slots/${id}`)
    return { ...validated, day: dayToFr(validated.day) }
  },

  remove: async (id: number): Promise<void> => {
    await apiFetch<void>(`/timetable/slots/${id}`, { method: "DELETE" })
  },

  diagnostic: async (classId: number): Promise<TimetableDiagnostic> => {
    return apiFetch(`/timetable/diagnostic?class_id=${classId}`)
  },

  generate: async (classId: number): Promise<GenerateTaskResponse> => {
    return apiFetch(`/timetable/auto-generate?class_id=${classId}`, {
      method: "POST",
    })
  },

  taskStatus: async (taskId: string): Promise<GenerateTaskResponse> => {
    return apiFetch(`/timetable/tasks/${taskId}`, { schema: GenerateTaskResponseSchema })
  },

  // Teacher availabilities
  listAvailabilities: async (teacherId: number): Promise<TeacherAvailability[]> => {
    const json = await apiFetch<TeacherAvailability[] | { data?: TeacherAvailability[] }>(
      `/teachers/${teacherId}/availabilities`,
    )
    const arr = Array.isArray(json) ? json : json.data ?? []
    return safeValidate(TeacherAvailabilityArraySchema, arr, `/teachers/${teacherId}/availabilities`)
  },

  createAvailability: async (
    teacherId: number,
    data: TeacherAvailabilityCreate,
  ): Promise<TeacherAvailability> => {
    const json = await apiFetch<TeacherAvailability | { data?: TeacherAvailability }>(
      `/teachers/${teacherId}/availabilities`,
      { method: "POST", body: JSON.stringify(data) },
    )
    const item = (json as { data?: TeacherAvailability }).data ?? (json as TeacherAvailability)
    return safeValidate(TeacherAvailabilitySchema, item, `POST /teachers/${teacherId}/availabilities`)
  },

  updateAvailability: async (
    availabilityId: number,
    data: TeacherAvailabilityUpdate,
  ): Promise<TeacherAvailability> => {
    const json = await apiFetch<TeacherAvailability | { data?: TeacherAvailability }>(
      `/teacher-availabilities/${availabilityId}`,
      { method: "PATCH", body: JSON.stringify(data) },
    )
    const item = (json as { data?: TeacherAvailability }).data ?? (json as TeacherAvailability)
    return safeValidate(TeacherAvailabilitySchema, item, `PATCH /teacher-availabilities/${availabilityId}`)
  },

  // La semaine occupee d'un enseignant, pour la montrer avant de choisir
  // l'horaire plutot que de refuser apres coup.
  teacherWeek: async (teacherId: number): Promise<TeacherWeek> => {
    const json = await apiFetch<unknown>(`/teachers/${teacherId}/week`)
    return safeValidate(TeacherWeekSchema, json, `/teachers/${teacherId}/week`)
  },

  // Portail enseignant : le backend resout l'enseignant depuis le jeton, le
  // front n'a jamais a connaitre son identifiant de profil.
  myWeek: async (): Promise<TeacherWeek> => {
    const json = await apiFetch<unknown>(`/teacher/week`)
    return safeValidate(TeacherWeekSchema, json, `/teacher/week`)
  },

  myAvailabilities: async (): Promise<TeacherAvailability[]> => {
    const json = await apiFetch<TeacherAvailability[] | { data?: TeacherAvailability[] }>(
      `/teacher/availabilities`,
    )
    const arr = Array.isArray(json) ? json : json.data ?? []
    return safeValidate(TeacherAvailabilityArraySchema, arr, `/teacher/availabilities`)
  },

  declareMyAvailability: async (
    data: TeacherAvailabilityCreate,
  ): Promise<TeacherAvailability> => {
    const json = await apiFetch<TeacherAvailability | { data?: TeacherAvailability }>(
      `/teacher/availabilities`,
      { method: "POST", body: JSON.stringify(data) },
    )
    const item = (json as { data?: TeacherAvailability }).data ?? (json as TeacherAvailability)
    return safeValidate(TeacherAvailabilitySchema, item, `POST /teacher/availabilities`)
  },

  updateMyAvailability: async (
    availabilityId: number,
    data: TeacherAvailabilityUpdate,
  ): Promise<TeacherAvailability> => {
    const json = await apiFetch<TeacherAvailability | { data?: TeacherAvailability }>(
      `/teacher/availabilities/${availabilityId}`,
      { method: "PATCH", body: JSON.stringify(data) },
    )
    const item = (json as { data?: TeacherAvailability }).data ?? (json as TeacherAvailability)
    return safeValidate(
      TeacherAvailabilitySchema,
      item,
      `PATCH /teacher/availabilities/${availabilityId}`,
    )
  },

  deleteMyAvailability: async (availabilityId: number): Promise<void> => {
    await apiFetch<void>(`/teacher/availabilities/${availabilityId}`, { method: "DELETE" })
  },

  deleteAvailability: async (availabilityId: number): Promise<void> => {
    await apiFetch<void>(`/teacher-availabilities/${availabilityId}`, { method: "DELETE" })
  },

  exportPdf: async (classId: number): Promise<Blob> => {
    const session = await getSession()
    const params = new URLSearchParams({ class_id: String(classId) })
    const base = process.env.NEXT_PUBLIC_API_URL ?? ""
    const res = await fetch(`${base}/timetable/export-pdf?${params}`, {
      headers: {
        ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      },
    })
    if (!res.ok) throw new Error("Erreur lors de l'export PDF")
    return res.blob()
  },
}
