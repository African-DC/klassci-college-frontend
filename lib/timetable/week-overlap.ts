/**
 * Ce qui empêche de poser un créneau, dit avant de cliquer.
 *
 * Le serveur refuse déjà avec une phrase complète, mais un refus arrive après
 * coup : la personne a choisi son enseignant, son jour, son horaire, et
 * découvre seulement en validant que c'était impossible. La même règle
 * appliquée ici, sur la semaine déjà chargée, permet de le dire pendant la
 * saisie.
 *
 * « La même règle » au sens strict : ce module ne décide de rien. Il demande à
 * `occupation.ts` ce qui bloque, et se contente d'en faire une phrase. Quand
 * il décidait lui-même, la grille et lui répondaient différemment — la grille
 * laissait tracer un créneau que cet avertissement refusait aussitôt.
 */

import type { DayOfWeek, TeacherWeek } from "@/lib/contracts/timetable"
import { type Occupation, occupationsDuJour, premierEmpechement } from "./occupation"
import { enMinutes } from "./semaine"

/** Le formulaire parle français, le serveur anglais. */
const JOURS_VERS_EN: Record<string, DayOfWeek> = {
  lundi: "monday",
  mardi: "tuesday",
  mercredi: "wednesday",
  jeudi: "thursday",
  vendredi: "friday",
  samedi: "saturday",
}

/**
 * Le nom français de chaque jour, dans le type littéral et pas en `string`.
 *
 * Les formulaires stockent le jour en français et leur schéma n'accepte que
 * ces six valeurs : garder le type littéral évite un cast à chaque traduction.
 */
export const JOURS_FR = {
  monday: "lundi",
  tuesday: "mardi",
  wednesday: "mercredi",
  thursday: "jeudi",
  friday: "vendredi",
  saturday: "samedi",
} as const satisfies Record<DayOfWeek, string>

export function versJourAnglais(jour: string | undefined): DayOfWeek | undefined {
  if (!jour) return undefined
  if (jour in JOURS_VERS_EN) return JOURS_VERS_EN[jour]
  return jour in JOURS_FR ? (jour as DayOfWeek) : undefined
}

export type Empechement = {
  /** `course` : il enseigne ailleurs. `closed` : plage fermée. `not_open` : hors des plages ouvertes. */
  kind: Occupation["motif"]
  message: string
}

function versHHMM(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`
}

function phrase(nom: string, jourFr: string, o: Occupation, debut: string, fin: string): string {
  const de = `de ${versHHMM(o.debut)} à ${versHHMM(o.fin)}`
  switch (o.motif) {
    case "course": {
      const classe = o.class_name ? ` avec la ${o.class_name}` : ""
      return `${nom} a déjà ${o.label ?? "cours"}${classe} le ${jourFr} ${de}.`
    }
    case "closed":
      return `${nom} est déclaré indisponible le ${jourFr} ${de}.`
    default:
      return (
        `${nom} n'est pas déclaré disponible le ${jourFr} de ${debut} à ${fin}. ` +
        "Ouvrez cette plage dans ses disponibilités si le cours doit y tenir."
      )
  }
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

  const bloquant = premierEmpechement(occupationsDuJour(semaine, jourEn), d, f)
  if (!bloquant) return null

  return {
    kind: bloquant.motif,
    message: phrase(semaine.teacher_name, JOURS_FR[jourEn], bloquant, debut!, fin!),
  }
}
