import { z } from "zod"
import { apiFetch, safeValidate } from "./client"
import {
  TimetableSlotSchema,
  GenerateTaskResponseSchema,
  TeacherAvailabilitySchema,
  type TimetableSlot,
  type TimetableSlotCreate,
  type TimetableSlotUpdate,
  type GenerateTaskResponse,
  type TeacherAvailability,
  type TeacherAvailabilityCreate,
  type TeacherAvailabilityUpdate,
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
  listByClass: async (classId: number, weekOffset?: number): Promise<TimetableSlot[]> => {
    const params = new URLSearchParams({ class_id: String(classId) })
    if (weekOffset !== undefined && weekOffset !== 0) {
      params.set("week_offset", String(weekOffset))
    }
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

  deleteAvailability: async (availabilityId: number): Promise<void> => {
    await apiFetch<void>(`/teacher-availabilities/${availabilityId}`, { method: "DELETE" })
  },
}
