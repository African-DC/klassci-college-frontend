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
export function normalizeScheduleEvent(value: unknown): ScheduleEvent {
  const event = value as Record<string, unknown>
  return safeValidate(ScheduleEventSchema, {
    ...event,
    day: FR[String(event.day)] ?? event.day,
    start_time: String(event.start_time ?? "").slice(0, 5),
    end_time: String(event.end_time ?? "").slice(0, 5),
  }, "schedule-event")
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
  create: async (input: ScheduleEventCreate) => {
    const data = await apiFetch<unknown>("/timetable/events", {
      method: "POST", body: JSON.stringify(payload(input)),
    })
    return normalizeScheduleEvent((data as { data?: unknown })?.data ?? data)
  },
  update: async (id: number, input: ScheduleEventCreate) => {
    const data = await apiFetch<unknown>(`/timetable/events/${id}`, {
      method: "PUT", body: JSON.stringify(payload(input)),
    })
    return normalizeScheduleEvent(data)
  },
  delete: async (id: number) =>
    apiFetch<void>(`/timetable/events/${id}`, { method: "DELETE" }),
}
