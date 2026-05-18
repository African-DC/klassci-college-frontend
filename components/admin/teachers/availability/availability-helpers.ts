/**
 * Helpers et constantes pour l'onglet Disponibilités enseignant.
 *
 * Extrait de TeacherAvailabilityTab.tsx pour respecter la rule
 * `.claude/rules/detail-tab-split-pattern.md` (450 LOC -> split).
 */

import type { DayOfWeek, TeacherAvailability } from "@/lib/contracts/timetable"

export const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: "monday", label: "Lundi" },
  { key: "tuesday", label: "Mardi" },
  { key: "wednesday", label: "Mercredi" },
  { key: "thursday", label: "Jeudi" },
  { key: "friday", label: "Vendredi" },
  { key: "saturday", label: "Samedi" },
]

// 07:00 a 18:00 (11 creneaux)
export const HOURS = Array.from({ length: 11 }, (_, i) => {
  const h = 7 + i
  return {
    start: `${String(h).padStart(2, "0")}:00`,
    end: `${String(h + 1).padStart(2, "0")}:00`,
    label: `${String(h).padStart(2, "0")}h`,
  }
})

export type CellState = "unavailable" | "available" | "preferred"

// L'utilisateur clique pour cycler : unavailable -> available -> preferred ->
// unavailable (delete). En mode edition seulement.
export const NEXT_STATE: Record<CellState, CellState> = {
  unavailable: "available",
  available: "preferred",
  preferred: "unavailable",
}

export const STATE_STYLES: Record<CellState, string> = {
  unavailable: "bg-rose-500/15 text-rose-600 ring-1 ring-rose-300/40",
  available: "bg-emerald-500/20 text-emerald-700 ring-1 ring-emerald-500/30",
  preferred: "bg-primary/15 text-primary ring-1 ring-primary/30",
}

export const STATE_LABELS: Record<CellState, string> = {
  unavailable: "",
  available: "Dispo",
  preferred: "Préféré",
}

export interface SavedCell {
  id: number
  state: CellState
}

export type PendingChange =
  | { kind: "create"; target: Exclude<CellState, "unavailable"> }
  | { kind: "update"; existingId: number; target: Exclude<CellState, "unavailable"> }
  | { kind: "delete"; existingId: number; target: "unavailable" }

export function cellKey(day: DayOfWeek, start: string, end: string) {
  return `${day}|${start}|${end}`
}

export function buildSavedMap(
  availabilities: TeacherAvailability[],
): Map<string, SavedCell> {
  const m = new Map<string, SavedCell>()
  for (const av of availabilities) {
    const state: CellState = av.preferred
      ? "preferred"
      : av.available
        ? "available"
        : "unavailable"
    m.set(cellKey(av.day, av.start_time, av.end_time), { id: av.id, state })
  }
  return m
}
