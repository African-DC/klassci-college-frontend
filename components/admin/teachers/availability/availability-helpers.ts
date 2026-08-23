/**
 * Helpers et constantes pour l'onglet Disponibilités enseignant.
 *
 * Extrait de TeacherAvailabilityTab.tsx pour respecter la rule
 * `.claude/rules/detail-tab-split-pattern.md` (450 LOC -> split).
 */

import type { DayOfWeek, TeacherAvailability } from "@/lib/contracts/timetable"
import { HEURES, JOURS, JOURS_COURTS } from "@/lib/timetable/semaine"
import { JOURS_FR } from "@/lib/timetable/week-overlap"

const JOURS_FR_LONG: Record<keyof typeof JOURS_FR, string> = {
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
  saturday: "Samedi",
}

/** Les jours, depuis la source unique — plus une table de plus. */
export const DAYS: { key: DayOfWeek; label: string; court: string }[] = JOURS.map((key) => ({
  key,
  label: JOURS_FR_LONG[key],
  court: JOURS_COURTS[key],
}))

/** Une case par heure, sur l'amplitude partagée. */
export const HOURS = HEURES.map((h) => ({
  start: `${String(h).padStart(2, "0")}:00`,
  end: `${String(h + 1).padStart(2, "0")}:00`,
  label: `${String(h).padStart(2, "0")}h`,
}))

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

/**
 * Une case vide ne veut pas dire la meme chose selon la semaine.
 *
 * Tant que l'enseignant n'a rien declare, il est disponible partout : peindre
 * la semaine entiere en rouge « indisponible » etait un mensonge, et il
 * contredisait le bandeau juste au-dessus. Des qu'une plage est declaree, la
 * regle passe en liste blanche — cote backend comme pour la generation
 * automatique — et le reste est bel et bien ferme.
 */
export const UNDECLARED_STYLE = "bg-muted/50 ring-1 ring-inset ring-border/60"

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
