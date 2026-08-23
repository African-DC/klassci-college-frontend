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
import { JOURS_FR, enMinutes, versHHMM } from "./semaine"

/** Le formulaire parle français, le serveur anglais. */
const JOURS_VERS_EN: Record<string, DayOfWeek> = {
  lundi: "monday",
  mardi: "tuesday",
  mercredi: "wednesday",
  jeudi: "thursday",
  vendredi: "friday",
  samedi: "saturday",
}


export function versJourAnglais(jour: string | undefined): DayOfWeek | undefined {
  if (!jour) return undefined
  if (Object.hasOwn(JOURS_VERS_EN, jour)) return JOURS_VERS_EN[jour]
  return Object.hasOwn(JOURS_FR, jour) ? (jour as DayOfWeek) : undefined
}

export type Empechement = {
  /** `course` : il enseigne ailleurs. `closed` : plage fermée. `not_open` : hors des plages ouvertes. */
  kind: Occupation["motif"]
  message: string
}


function phrase(nom: string, jourFr: string, o: Occupation, debut: number, fin: number): string {
  const de = `de ${versHHMM(o.debut)} à ${versHHMM(o.fin)}`
  switch (o.motif) {
    case "course": {
      const classe = o.class_name ? ` avec la ${o.class_name}` : ""
      return `${nom} a déjà ${o.label}${classe} le ${jourFr} ${de}.`
    }
    case "closed":
      return `${nom} est déclaré indisponible le ${jourFr} ${de}.`
    default:
      return (
        `${nom} n'est pas déclaré disponible le ${jourFr} de ${versHHMM(debut)} à ${versHHMM(fin)}. ` +
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
    message: phrase(semaine.teacher_name, JOURS_FR[jourEn], bloquant, d, f),
  }
}
