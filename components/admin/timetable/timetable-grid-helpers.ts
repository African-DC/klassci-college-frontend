import type { TimetableSlot } from "@/lib/contracts/timetable"
import { enMinutes } from "@/lib/timetable/semaine"

/** Une heure illisible ne doit pas se dessiner a minuit : on la saute. */
export const enMinutesStrict = (t: string): number => {
  const m = enMinutes(t)
  if (m === null) throw new Error(`Heure illisible : ${t}`)
  return m
}

const COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-100 border-blue-300 text-blue-800",
  emerald: "bg-emerald-100 border-emerald-300 text-emerald-800",
  amber: "bg-amber-100 border-amber-300 text-amber-800",
  violet: "bg-violet-100 border-violet-300 text-violet-800",
  rose: "bg-rose-100 border-rose-300 text-rose-800",
  cyan: "bg-cyan-100 border-cyan-300 text-cyan-800",
  orange: "bg-orange-100 border-orange-300 text-orange-800",
  indigo: "bg-indigo-100 border-indigo-300 text-indigo-800",
  teal: "bg-teal-100 border-teal-300 text-teal-800",
  red: "bg-red-100 border-red-300 text-red-800",
  green: "bg-green-100 border-green-300 text-green-800",
  pink: "bg-pink-100 border-pink-300 text-pink-800",
}
const DEFAULT_SLOT_COLOR = "bg-slate-100 border-slate-300 text-slate-800"

export function getSlotColor(subjectColor: string | null | undefined): string {
  if (!subjectColor) return DEFAULT_SLOT_COLOR
  return COLOR_MAP[subjectColor] ?? DEFAULT_SLOT_COLOR
}

export function sortSlotsByTime(slots: TimetableSlot[]): TimetableSlot[] {
  return [...slots].sort((a, b) => enMinutesStrict(a.start_time) - enMinutesStrict(b.start_time))
}

export function formatDuration(start: string, end: string): string {
  const minutes = enMinutesStrict(end) - enMinutesStrict(start)
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours > 0 && rest > 0) return `${hours}h${String(rest).padStart(2, "0")}`
  if (hours > 0) return `${hours}h`
  return `${rest} min`
}
