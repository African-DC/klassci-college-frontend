type Times = { id: number; start_time: string; end_time: string }

/** Cours et pauses d'une journée, dans l'ordre de l'horloge. */
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
