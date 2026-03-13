import { z } from "zod"
import { apiFetch } from "./client"
import {
  TimetableSlotSchema,
  GenerateTaskResponseSchema,
  type TimetableSlot,
  type TimetableSlotCreate,
  type TimetableSlotUpdate,
  type GenerateTaskResponse,
} from "@/lib/contracts/timetable"

export type { TimetableSlot, TimetableSlotCreate, TimetableSlotUpdate, GenerateTaskResponse }

const TimetableSlotArraySchema = z.array(TimetableSlotSchema)

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
    return TimetableSlotArraySchema.parse(arr)
  },

  listByTeacher: async (teacherId: number): Promise<TimetableSlot[]> => {
    const json = await apiFetch<{ data?: TimetableSlot[] } | TimetableSlot[]>(
      `/timetable?teacher_id=${teacherId}`,
    )
    const arr = Array.isArray(json) ? json : json.data ?? []
    return TimetableSlotArraySchema.parse(arr)
  },

  create: async (data: TimetableSlotCreate): Promise<TimetableSlot> => {
    const json = await apiFetch<{ data?: TimetableSlot } | TimetableSlot>(
      `/timetable`,
      { method: "POST", body: JSON.stringify(data) },
    )
    const slot = (json as { data?: TimetableSlot }).data ?? (json as TimetableSlot)
    return TimetableSlotSchema.parse(slot)
  },

  update: async (id: number, data: TimetableSlotUpdate): Promise<TimetableSlot> => {
    const json = await apiFetch<{ data?: TimetableSlot } | TimetableSlot>(
      `/timetable/${id}`,
      { method: "PATCH", body: JSON.stringify(data) },
    )
    const slot = (json as { data?: TimetableSlot }).data ?? (json as TimetableSlot)
    return TimetableSlotSchema.parse(slot)
  },

  remove: async (id: number): Promise<void> => {
    await apiFetch<void>(`/timetable/${id}`, { method: "DELETE" })
  },

  generate: async (classId: number): Promise<GenerateTaskResponse> => {
    return apiFetch(`/timetable/generate`, {
      method: "POST",
      body: JSON.stringify({ class_id: classId }),
      schema: GenerateTaskResponseSchema,
    })
  },

  taskStatus: async (taskId: string): Promise<GenerateTaskResponse> => {
    return apiFetch(`/timetable/tasks/${taskId}`, { schema: GenerateTaskResponseSchema })
  },
}
