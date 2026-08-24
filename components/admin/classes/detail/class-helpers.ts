import type { Day, TimetableSlot } from "@/lib/contracts/timetable"

/**
 * Helpers purs pour la fiche classe : ordre des jours, libellés FR, et
 * dérivation matières / enseignants à partir des créneaux EDT.
 *
 * Rappel métier (cf. rules projet) : le lien prof↔classe et matière↔classe
 * est IMPLICITE via l'emploi du temps. On dérive donc ces listes des slots.
 */

// Ordre canonique d'affichage (le BE renvoie soit les jours FR soit EN).
export const DAY_ORDER: Day[] = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
]

const DAY_LABELS: Record<Day, string> = {
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

// Normalise un jour (FR ou EN) vers sa clé FR canonique.
const DAY_TO_FR: Record<Day, Day> = {
  lundi: "lundi",
  mardi: "mardi",
  mercredi: "mercredi",
  jeudi: "jeudi",
  vendredi: "vendredi",
  samedi: "samedi",
  monday: "lundi",
  tuesday: "mardi",
  wednesday: "mercredi",
  thursday: "jeudi",
  friday: "vendredi",
  saturday: "samedi",
}

export function dayLabel(day: Day): string {
  return DAY_LABELS[day] ?? day
}

export function normalizeDay(day: Day): Day {
  return DAY_TO_FR[day] ?? day
}

/** Heure "08:00:00" → "08:00". */
export function formatTime(time: string): string {
  return time.slice(0, 5)
}

export interface SlotsByDay {
  day: Day
  slots: TimetableSlot[]
}

/** Regroupe les créneaux par jour, triés par jour puis par heure de début. */
export function groupSlotsByDay(slots: TimetableSlot[]): SlotsByDay[] {
  const byDay = new Map<Day, TimetableSlot[]>()
  for (const slot of slots) {
    const key = normalizeDay(slot.day)
    const bucket = byDay.get(key) ?? []
    bucket.push(slot)
    byDay.set(key, bucket)
  }
  return DAY_ORDER.filter((d) => byDay.has(d)).map((day) => ({
    day,
    slots: (byDay.get(day) ?? []).sort((a, b) =>
      a.start_time.localeCompare(b.start_time),
    ),
  }))
}

export interface DerivedSubject {
  subject_id: number
  subject_name: string
  subject_color?: string | null
  teacher_names: string[]
  slot_count: number
}

/** Matières distinctes enseignées dans la classe (dérivées des slots). */
export function deriveSubjects(slots: TimetableSlot[]): DerivedSubject[] {
  const map = new Map<number, DerivedSubject>()
  for (const slot of slots) {
    const existing = map.get(slot.subject_id)
    if (existing) {
      existing.slot_count += 1
      if (slot.teacher_name && !existing.teacher_names.includes(slot.teacher_name)) {
        existing.teacher_names.push(slot.teacher_name)
      }
    } else {
      map.set(slot.subject_id, {
        subject_id: slot.subject_id,
        subject_name: slot.subject_name,
        subject_color: slot.subject_color,
        teacher_names: slot.teacher_name ? [slot.teacher_name] : [],
        slot_count: 1,
      })
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    a.subject_name.localeCompare(b.subject_name, "fr"),
  )
}

export interface DerivedTeacher {
  teacher_id: number
  teacher_name: string
  subject_names: string[]
  slot_count: number
}

/** Enseignants distincts intervenant dans la classe (dérivés des slots). */
export function deriveTeachers(slots: TimetableSlot[]): DerivedTeacher[] {
  const map = new Map<number, DerivedTeacher>()
  for (const slot of slots) {
    const existing = map.get(slot.teacher_id)
    if (existing) {
      existing.slot_count += 1
      if (slot.subject_name && !existing.subject_names.includes(slot.subject_name)) {
        existing.subject_names.push(slot.subject_name)
      }
    } else {
      map.set(slot.teacher_id, {
        teacher_id: slot.teacher_id,
        teacher_name: slot.teacher_name,
        subject_names: slot.subject_name ? [slot.subject_name] : [],
        slot_count: 1,
      })
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    a.teacher_name.localeCompare(b.teacher_name, "fr"),
  )
}
