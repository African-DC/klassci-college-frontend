/** Exact timetable labels; never infer one hour from a rounded grid row. */
export function durationMinutes(start: string, end: string): number {
  const toMinutes = (value: string) => {
    const m = /^(\\d{1,2}):(\\d{2})/.exec(value)
    if (!m) return NaN
    return Number(m[1]) * 60 + Number(m[2])
  }
  return toMinutes(end) - toMinutes(start)
}

export function durationLabel(start: string, end: string): string {
  const minutes = durationMinutes(start, end)
  if (!Number.isFinite(minutes) || minutes <= 0) return "Durée indisponible"
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (!hours) return `${rest} min`
  return rest ? `${hours} h ${String(rest).padStart(2, "0")}` : `${hours} h`
}

type Times = { id: number; start_time: string; end_time: string }
export function orderedTimetableEntries<Course extends Times, Event extends Times>(
  courses: Course[], events: Event[],
): ({ kind: "course"; item: Course } | { kind: "event"; item: Event })[] {
  const entries: ({ kind: "course"; item: Course } | { kind: "event"; item: Event })[] = [
    ...courses.map(item => ({ kind: "course" as const, item })),
    ...events.map(item => ({ kind: "event" as const, item })),
  ]
  return entries.sort(
    (a, b) =>
      a.item.start_time.localeCompare(b.item.start_time)
      || a.item.end_time.localeCompare(b.item.end_time)
      || a.kind.localeCompare(b.kind),
  )
}
