import { z } from "zod"
import { apiFetch, safeValidate } from "@/lib/api/client"
import { dayToEn, dayToFr } from "@/lib/timetable/days"
import {
  ScheduleEventSchema, ScheduleEventCreateSchema,
  type ScheduleEvent, type ScheduleEventCreate,
} from "@/lib/contracts/schedule-events"

// Forme brute du serveur : jour en anglais, heures possiblement avec secondes.
const ScheduleEventRawSchema = z.object({
  day: z.string(),
  start_time: z.string(),
  end_time: z.string(),
}).passthrough()

/** Le serveur enveloppe parfois la réponse dans `{ data }`. */
function unwrapData(value: unknown): unknown {
  return typeof value === "object" && value !== null && "data" in value ? value.data : value
}

export function normalizeScheduleEvent(value: unknown): ScheduleEvent {
  const raw = safeValidate(ScheduleEventRawSchema, value, "schedule-event")
  return safeValidate(ScheduleEventSchema, {
    ...raw,
    day: dayToFr(raw.day),
    start_time: raw.start_time.slice(0, 5),
    end_time: raw.end_time.slice(0, 5),
  }, "schedule-event")
}
function payload(data: ScheduleEventCreate) {
  const parsed = ScheduleEventCreateSchema.parse(data)
  return { ...parsed, day: dayToEn(parsed.day) }
}
export const scheduleEventsApi = {
  list: async (yearId: number, classId?: number) => {
    const q = new URLSearchParams({ academic_year_id: String(yearId) })
    if (classId) q.set("class_id", String(classId))
    const data = await apiFetch<unknown>(`/timetable/events?${q}`)
    const items = Array.isArray(data) ? data : (data as { data?: unknown[] }).data ?? []
    return items.map(normalizeScheduleEvent)
  },
  createMany: async (input: ScheduleEventCreate, days: ScheduleEventCreate["day"][]) => {
    const data = await apiFetch<unknown>("/timetable/events/bulk", {
      method: "POST",
      body: JSON.stringify({
        events: days.map(day => payload({ ...input, day })),
      }),
    })
    const items = Array.isArray(data) ? data : (data as { data?: unknown[] }).data ?? []
    return items.map(normalizeScheduleEvent)
  },
  update: async (id: number, input: ScheduleEventCreate) => {
    const data = await apiFetch<unknown>(`/timetable/events/${id}`, {
      method: "PUT", body: JSON.stringify(payload(input)),
    })
    return normalizeScheduleEvent(unwrapData(data))
  },
  delete: async (id: number) =>
    apiFetch<void>(`/timetable/events/${id}`, { method: "DELETE" }),
}
