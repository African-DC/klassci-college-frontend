/**
 * Les jours et les heures de la semaine scolaire — une seule fois.
 *
 * Le dépôt en portait quatre définitions : deux tables de jours dans les deux
 * grilles, une troisième pour la traduction français/anglais, une quatrième
 * dans l'en-tête de l'emploi du temps. Elles avaient déjà divergé : « hors des
 * plages déclarées » s'affichait rose sur un écran et gris sur l'autre, et le
 * rose voulait dire « indisponible » sur le second. Deux écrans, un enseignant,
 * une phrase, deux couleurs.
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

export const JOURS_COURTS: Record<DayOfWeek, string> = {
  monday: "Lun",
  tuesday: "Mar",
  wednesday: "Mer",
  thursday: "Jeu",
  friday: "Ven",
  saturday: "Sam",
}

/** 7 h à 18 h : l'amplitude d'une journée de collège ivoirien. */
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
 * On reprend la même mesure pour que les deux grilles se lisent pareil.
 */
export const PX_PAR_HEURE = 60

/** La position verticale d'un instant, en pixels depuis le haut de la grille. */
export function minutesEnPx(minutes: number): number {
  return ((minutes - HEURE_DEBUT * 60) / 60) * PX_PAR_HEURE
}

export function versHHMM(heure: number): string {
  return `${String(heure).padStart(2, "0")}:00`
}

/** Minutes depuis minuit, ou `null` si ce n'est pas une heure « HH:MM ». */
export function enMinutes(valeur: string | undefined | null): number | null {
  if (!valeur) return null
  const m = /^(\d{1,2}):(\d{2})$/.exec(valeur)
  if (!m) return null
  return Number(m[1]) * 60 + Number(m[2])
}

/** Deux intervalles en minutes se chevauchent-ils ? Bord à bord ne compte pas. */
export function seChevauchent(d1: number, f1: number, d2: number, f2: number): boolean {
  return d1 < f2 && f1 > d2
}

/**
 * Cette heure pleine est-elle touchée par l'intervalle « HH:MM » donné ?
 *
 * Le test se fait en minutes et jamais en heures arrondies : les créneaux
 * existants commencent à 08:30 aussi souvent qu'à 08:00, et arrondir ferait
 * disparaître de la grille tout ce qui dure moins d'une heure.
 */
export function couvre(debut: string, fin: string, heure: number): boolean {
  const d = enMinutes(debut)
  const f = enMinutes(fin)
  return d !== null && f !== null && seChevauchent(d, f, heure * 60, (heure + 1) * 60)
}
