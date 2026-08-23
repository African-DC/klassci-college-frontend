/**
 * Ce qui empêche de poser un créneau, dit avant de cliquer.
 *
 * Le backend refuse déjà avec une phrase complète, mais un refus arrive après
 * coup : la personne a choisi son enseignant, son jour, son horaire, et
 * découvre seulement en validant que c'était impossible. Les mêmes règles
 * appliquées ici, sur la semaine déjà chargée, permettent de le dire pendant
 * la saisie.
 *
 * La règle est celle du backend et du générateur automatique : tant qu'un
 * enseignant n'a rien déclaré il est disponible partout ; dès qu'il a déclaré
 * une plage, seules celles-là restent ouvertes.
 */

import type { DayOfWeek, TeacherWeek } from "@/lib/contracts/timetable"

/** Le formulaire parle français, le backend anglais. */
const JOURS_VERS_EN: Record<string, DayOfWeek> = {
  lundi: "monday",
  mardi: "tuesday",
  mercredi: "wednesday",
  jeudi: "thursday",
  vendredi: "friday",
  samedi: "saturday",
}

/**
 * Le nom francais de chaque jour, dans le type litteral et pas en `string`.
 *
 * Les formulaires stockent le jour en francais et leur schema n'accepte que ces
 * six valeurs : garder le type litteral evite un cast a chaque fois qu'on
 * traduit depuis l'anglais.
 */
export const JOURS_FR = {
  monday: "lundi",
  tuesday: "mardi",
  wednesday: "mercredi",
  thursday: "jeudi",
  friday: "vendredi",
  saturday: "samedi",
} as const satisfies Record<DayOfWeek, string>

export type JourFr = (typeof JOURS_FR)[DayOfWeek]

export function versJourAnglais(jour: string | undefined): DayOfWeek | undefined {
  if (!jour) return undefined
  return JOURS_VERS_EN[jour] ?? (JOURS_FR[jour as DayOfWeek] ? (jour as DayOfWeek) : undefined)
}

/** Minutes depuis minuit, ou `null` si ce n'est pas une heure « HH:MM ». */
export function enMinutes(heure: string | undefined): number | null {
  if (!heure) return null
  const m = /^(\d{1,2}):(\d{2})$/.exec(heure)
  if (!m) return null
  return Number(m[1]) * 60 + Number(m[2])
}

/** Deux plages se chevauchent si l'une commence avant que l'autre finisse. */
export function seChevauchent(
  debutA: string,
  finA: string,
  debutB: string,
  finB: string,
): boolean {
  const a1 = enMinutes(debutA)
  const a2 = enMinutes(finA)
  const b1 = enMinutes(debutB)
  const b2 = enMinutes(finB)
  if (a1 === null || a2 === null || b1 === null || b2 === null) return false
  return a1 < b2 && a2 > b1
}

export type Empechement = {
  /** `course` : il enseigne ailleurs. `closed` : plage fermée. `not_open` : hors des plages ouvertes. */
  kind: "course" | "closed" | "not_open"
  message: string
}

/**
 * L'empêchement qui bloquerait ce créneau, ou `null` s'il passe.
 *
 * Renvoie une phrase complète et non un code : c'est elle qui s'affiche, et la
 * personne qui saisit doit pouvoir agir sans traduire quoi que ce soit.
 */
export function trouverEmpechement(
  semaine: TeacherWeek | undefined,
  jour: string | undefined,
  debut: string | undefined,
  fin: string | undefined,
): Empechement | null {
  if (!semaine) return null
  const jourEn = versJourAnglais(jour)
  const d = enMinutes(debut)
  const f = enMinutes(fin)
  if (!jourEn || d === null || f === null || d >= f) return null

  const jourFr = JOURS_FR[jourEn]
  const nom = semaine.teacher_name

  const cours = semaine.busy.find(
    (b) =>
      b.day === jourEn &&
      b.kind === "course" &&
      seChevauchent(debut!, fin!, b.start_time, b.end_time),
  )
  if (cours) {
    const classe = cours.class_name ? ` avec la ${cours.class_name}` : ""
    return {
      kind: "course",
      message: `${nom} a déjà ${cours.label}${classe} le ${jourFr} de ${cours.start_time} à ${cours.end_time}.`,
    }
  }

  const fermeture = semaine.busy.find(
    (b) =>
      b.day === jourEn &&
      b.kind === "unavailable" &&
      seChevauchent(debut!, fin!, b.start_time, b.end_time),
  )
  if (fermeture) {
    return {
      kind: "closed",
      message: `${nom} est déclaré indisponible le ${jourFr} de ${fermeture.start_time} à ${fermeture.end_time}.`,
    }
  }

  if (!semaine.has_declarations) return null

  const couvert = semaine.open.some((o) => {
    const o1 = enMinutes(o.start_time)
    const o2 = enMinutes(o.end_time)
    return o.day === jourEn && o1 !== null && o2 !== null && o1 <= d && o2 >= f
  })
  if (couvert) return null

  return {
    kind: "not_open",
    message: `${nom} n'est pas déclaré disponible le ${jourFr} de ${debut} à ${fin}. Ouvrez cette plage dans ses disponibilités si le cours doit y tenir.`,
  }
}
