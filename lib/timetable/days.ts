import { JOURS, JOURS_FR, JOURS_NOMS } from "@/lib/timetable/semaine"
import type { DayOfWeek } from "@/lib/contracts/timetable"

const FR_TO_EN: Record<string, DayOfWeek> = Object.fromEntries(
  JOURS.map((j) => [JOURS_FR[j], j]),
)

/** Jour du serveur (anglais) vers le français des formulaires. Inconnu : inchangé. */
export function dayToFr<D extends string>(day: D): D {
  return (Object.hasOwn(JOURS_FR, day) ? JOURS_FR[day as DayOfWeek] : day) as D
}

/** Jour français vers le nom anglais du serveur. Inconnu : inchangé. */
export function dayToEn<D extends string>(day: D): D {
  return (Object.hasOwn(FR_TO_EN, day) ? FR_TO_EN[day] : day) as D
}

/** Libellé long d'un jour français (« lundi » → « Lundi »). Inconnu : inchangé. */
export function dayLabelFr(day: string): string {
  const en = Object.hasOwn(FR_TO_EN, day) ? FR_TO_EN[day] : undefined
  return en ? JOURS_NOMS[en].long : day
}
