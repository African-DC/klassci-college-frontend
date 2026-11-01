import { enMinutes } from "@/lib/timetable/semaine"

/** Exact timetable labels; never infer one hour from a rounded grid row. */
export function durationMinutes(start: string, end: string): number {
  const debut = enMinutes(start)
  const fin = enMinutes(end)
  if (debut === null || fin === null) return NaN
  return fin - debut
}

export function durationLabel(start: string, end: string): string {
  const minutes = durationMinutes(start, end)
  if (!Number.isFinite(minutes) || minutes <= 0) return "Durée indisponible"
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (!hours) return `${rest} min`
  return rest ? `${hours} h ${String(rest).padStart(2, "0")}` : `${hours} h`
}
