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
export const HEURES = Array.from({ length: 11 }, (_, i) => 7 + i)

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
