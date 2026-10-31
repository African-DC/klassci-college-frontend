import { z } from "zod"
import { apiFetch, safeValidate } from "@/lib/api/client"
import {
  ScheduleEventSchema, ScheduleEventCreateSchema,
  type ScheduleEvent, type ScheduleEventCreate,
} from "@/lib/contracts/schedule-events"

const EN: Record<string, string> = {
  lundi: "monday", mardi: "tuesday", mercredi: "wednesday",
  jeudi: "thursday", vendredi: "friday", samedi: "saturday",
}
const FR: Record<string, string> = Object.fromEntries(
  Object.entries(EN).map(([fr, en]) => [en, fr]),
)
function fromApi(value: unknown): ScheduleEvent {
  const event = value as Record<string, unknown>
  return safeValidate(ScheduleEventSchema, { ...event, day: FR[String(event.day)] ?? event.day }, "schedule-event")
}
function payload(data: ScheduleEventCreate) {
  const parsed = ScheduleEventCreateSchema.parse(data)
  return { ...parsed, day: EN[parsed.day] }
}
export const scheduleEventsApi = {
  list: async (yearId: number, classId?: number) => {
    const q = new URLSearchParams({ academic_year_id: String(yearId) })
    if (classId) q.set("class_id", String(classId))
    const data = await apiFetch<unknown>(`/timetable/events?${q}`)
    return (data as unknown[]).map(fromApi)
  },
  create: async (input: ScheduleEventCreate) => {
    const data = await apiFetch<unknown>("/timetable/events", {
      method: "POST", body: JSON.stringify(payload(input)),
    })
    return fromApi(data)
  },
  update: async (id: number, input: ScheduleEventCreate) => {
    const data = await apiFetch<unknown>(`/timetable/events/${id}`, {
      method: "PUT", body: JSON.stringify(payload(input)),
    })
    return fromApi(data)
  },
  delete: async (id: number) =>
    apiFetch<void>(`/timetable/events/${id}`, { method: "DELETE" }),
}
