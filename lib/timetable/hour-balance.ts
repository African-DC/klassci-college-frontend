import type { TimetableSlot } from "@/lib/contracts/timetable"

function asMinutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number)
  return hour * 60 + minute
}

/** Project a subject's weekly usage, excluding the slot currently edited. */
export function projectedSubjectMinutes(
  slots: TimetableSlot[],
  candidate: { subject_id: number; academic_year_id: number; start_time: string; end_time: string },
  editingId?: number,
): number {
  const existing = slots
    .filter((slot) =>
      slot.id !== editingId &&
      slot.subject_id === candidate.subject_id &&
      slot.academic_year_id === candidate.academic_year_id,
    )
    .reduce((minutes, slot) => minutes + Math.max(0, asMinutes(slot.end_time) - asMinutes(slot.start_time)), 0)
  return existing + Math.max(0, asMinutes(candidate.end_time) - asMinutes(candidate.start_time))
}

export function formatWeeklyMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return remaining ? `${hours} h ${String(remaining).padStart(2, "0")}` : `${hours} h`
}
