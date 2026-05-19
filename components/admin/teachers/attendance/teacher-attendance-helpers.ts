import type { TimetableSlot } from "@/lib/contracts/timetable"
import type { TeacherAttendanceStatus } from "@/lib/contracts/teacher-attendance"

export const STATUS_LABEL: Record<TeacherAttendanceStatus, string> = {
  present: "Présent",
  absent_excused: "Absence justifiée",
  absent_unexcused: "Absence non justifiée",
  late: "En retard",
}

type Tone = "emerald" | "amber" | "rose" | "blue" | "neutral"

export const STATUS_TONE: Record<TeacherAttendanceStatus, Tone> = {
  present: "emerald",
  absent_excused: "amber",
  absent_unexcused: "rose",
  late: "blue",
}

export const STATUS_CHIP_CLASS: Record<TeacherAttendanceStatus, string> = {
  present: "bg-emerald-50 text-emerald-700 border-emerald-200",
  absent_excused: "bg-amber-50 text-amber-700 border-amber-200",
  absent_unexcused: "bg-rose-50 text-rose-700 border-rose-200",
  late: "bg-blue-50 text-blue-700 border-blue-200",
}

export const TONE_CLASSES: Record<Tone, { text: string; bg: string; ring: string }> = {
  emerald: { text: "text-emerald-700", bg: "bg-emerald-50", ring: "ring-emerald-100" },
  rose: { text: "text-rose-700", bg: "bg-rose-50", ring: "ring-rose-100" },
  blue: { text: "text-blue-700", bg: "bg-blue-50", ring: "ring-blue-100" },
  amber: { text: "text-amber-700", bg: "bg-amber-50", ring: "ring-amber-100" },
  neutral: {
    text: "text-muted-foreground",
    bg: "bg-muted/40",
    ring: "ring-muted-foreground/10",
  },
}

export const FRENCH_DAY_LABEL: Record<string, string> = {
  lundi: "Lundi",
  mardi: "Mardi",
  mercredi: "Mercredi",
  jeudi: "Jeudi",
  vendredi: "Vendredi",
  samedi: "Samedi",
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
  saturday: "Samedi",
}

const FRENCH_MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
]

const FRENCH_DAYS = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
]

export function formatLongFrenchDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  const day = FRENCH_DAYS[date.getUTCDay()]
  const dayNum = date.getUTCDate()
  const month = FRENCH_MONTHS[date.getUTCMonth()]
  return `${day} ${dayNum} ${month} ${y}`
}

export function formatShortFrenchDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number)
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`
}

export function formatRelativeFromNow(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number)
  const target = new Date(Date.UTC(y, m - 1, d))
  const today = new Date()
  const todayUtc = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()),
  )
  const diffDays = Math.round(
    (target.getTime() - todayUtc.getTime()) / (1000 * 60 * 60 * 24),
  )
  if (diffDays === 0) return "aujourd'hui"
  if (diffDays === -1) return "hier"
  if (diffDays === 1) return "demain"
  if (diffDays < 0) return `il y a ${Math.abs(diffDays)} jours`
  return `dans ${diffDays} jours`
}

/** Returns today as ISO YYYY-MM-DD (local time, used as default for date pickers). */
export function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function formatLateMinutes(minutes: number): string {
  if (minutes <= 0) return ""
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`
}

/** Builds the option label for a timetable slot select item. */
export function formatSlotOption(slot: TimetableSlot): string {
  const dayLabel = FRENCH_DAY_LABEL[slot.day] ?? slot.day
  return `${dayLabel} ${slot.start_time}–${slot.end_time} · ${slot.subject_name} · ${slot.class_name}`
}

/** Trims notes and returns null if empty (BE expects null over empty string). */
export function cleanNotes(notes: string | null | undefined): string | null {
  return notes?.trim() || null
}
