/**
 * Les jours et les heures de la semaine scolaire — une seule fois.
 *
 * Le dépôt en portait plusieurs définitions, et elles avaient déjà divergé :
 * « hors des plages déclarées » s'affichait rose sur un écran et gris sur
 * l'autre, où le rose voulait dire « indisponible ». Ce module est la seule
 * table de jours et la seule échelle de la semaine ; toute autre est un
 * doublon à supprimer, pas à synchroniser.
 */

import type { DayOfWeek } from "@/lib/contracts/timetable"

export const JOURS: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
]

/**
 * Les trois façons de nommer un jour, ensemble.
 *
 * `fr` est la valeur que les formulaires stockent — leur schéma n'accepte que
 * ces six chaînes, d'où le type littéral, qui évite un cast à chaque
 * traduction depuis l'anglais.
 */
export const JOURS_NOMS = {
  monday: { court: "Lun", long: "Lundi", fr: "lundi" },
  tuesday: { court: "Mar", long: "Mardi", fr: "mardi" },
  wednesday: { court: "Mer", long: "Mercredi", fr: "mercredi" },
  thursday: { court: "Jeu", long: "Jeudi", fr: "jeudi" },
  friday: { court: "Ven", long: "Vendredi", fr: "vendredi" },
  saturday: { court: "Sam", long: "Samedi", fr: "samedi" },
} as const satisfies Record<DayOfWeek, { court: string; long: string; fr: string }>

export type JourFr = (typeof JOURS_NOMS)[DayOfWeek]["fr"]

export const JOURS_COURTS: Record<DayOfWeek, string> = Object.fromEntries(
  JOURS.map((j) => [j, JOURS_NOMS[j].court]),
) as Record<DayOfWeek, string>

/** Le nom français minuscule, tel que les formulaires le stockent. */
export const JOURS_FR: Record<DayOfWeek, JourFr> = Object.fromEntries(
  JOURS.map((j) => [j, JOURS_NOMS[j].fr]),
) as Record<DayOfWeek, JourFr>

/** 7 h à 18 h : l'amplitude d'une journée de collège ivoirien, **à l'écran**. */
export const HEURE_DEBUT = 7
export const HEURE_FIN = 18
export const HEURES = Array.from({ length: HEURE_FIN - HEURE_DEBUT }, (_, i) => HEURE_DEBUT + i)

/**
 * Hauteur d'une heure, en pixels.
 *
 * La grille des classes place déjà ses cours ainsi : un bloc positionné en
 * absolu, haut de sa vraie durée. C'est ce qui permet à un cours de 8 h à
 * 8 h 30 d'occuper une demi-case au lieu d'en remplir une entière, et à un
 * cours de deux heures d'être un seul bloc plutôt que deux cases jumelles.
 */
export const PX_PAR_HEURE = 60

/** La position verticale d'un instant, en pixels depuis le haut de la grille. */
export function minutesEnPx(minutes: number): number {
  return ((minutes - HEURE_DEBUT * 60) / 60) * PX_PAR_HEURE
}

/** Minutes depuis minuit, ou `null` si ce n'est pas une heure « HH:MM ». */
export function enMinutes(valeur: string | undefined | null): number | null {
  if (!valeur) return null
  const m = /^(\d{1,2}):(\d{2})$/.exec(valeur)
  if (!m) return null
  return Number(m[1]) * 60 + Number(m[2])
}

/** « HH:MM » depuis des minutes — l'inverse de `enMinutes`, à côté d'elle. */
export function versHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}
