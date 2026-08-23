/**
 * Ce qui occupe la journée d'un enseignant, en minutes.
 *
 * La grille raisonnait en heures pleines : dès qu'un cours touchait l'heure de
 * 9 h, l'heure entière devenait interdite. Un cours qui finit à 9 h 30 fermait
 * donc 9 h 30 – 10 h, alors que le serveur, lui, l'accepte : il compare des
 * instants, pas des cases. Deux lectures de la même contrainte, et la plus
 * stricte des deux était la fausse.
 *
 * On renverse le modèle. Plutôt que de demander « cette heure est-elle
 * bloquée ? », on calcule les intervalles occupés, et le trait qu'on tire est
 * borné à l'espace libre qui l'entoure. La question des minutes ne se pose
 * plus : elle n'a jamais eu de réponse en heures.
 *
 * Ce module est **la** règle côté écran. La grille en tire ce qu'elle dessine
 * et ce qu'elle interdit ; l'avertissement de saisie en tire sa phrase. Les
 * deux répondaient séparément à la même question, et se sont mis à répondre
 * différemment : la grille laissait tracer ce que l'avertissement refusait.
 */

import type { DayOfWeek, TeacherWeek } from "@/lib/contracts/timetable"
import { HEURE_DEBUT, HEURE_FIN, enMinutes } from "./semaine"

export interface Intervalle {
  /** Minutes depuis minuit. */
  debut: number
  fin: number
}

/** Pourquoi un intervalle est pris. Les trois ne se disent pas pareil. */
export type Motif = "course" | "closed" | "not_open"

export interface Occupation extends Intervalle {
  motif: Motif
  /** L'intitulé du cours, quand c'en est un. */
  label?: string
  class_name?: string | null
}

export const JOURNEE: Intervalle = { debut: HEURE_DEBUT * 60, fin: HEURE_FIN * 60 }

function versIntervalle(debut: string, fin: string): Intervalle | null {
  const d = enMinutes(debut)
  const f = enMinutes(fin)
  return d === null || f === null || f <= d ? null : { debut: d, fin: f }
}

/** Fusionne ce qui se touche ou se chevauche, et trie. */
export function fusionner(intervalles: Intervalle[]): Intervalle[] {
  const tries = [...intervalles].sort((a, b) => a.debut - b.debut)
  const sortie: Intervalle[] = []
  for (const i of tries) {
    const dernier = sortie[sortie.length - 1]
    if (dernier && i.debut <= dernier.fin) dernier.fin = Math.max(dernier.fin, i.fin)
    else sortie.push({ debut: i.debut, fin: i.fin })
  }
  return sortie
}

/** Le complément d'une liste d'intervalles, à l'intérieur d'une borne. */
export function complement(intervalles: Intervalle[], borne: Intervalle): Intervalle[] {
  const sortie: Intervalle[] = []
  let curseur = borne.debut
  for (const i of fusionner(intervalles)) {
    if (i.debut > curseur) sortie.push({ debut: curseur, fin: Math.min(i.debut, borne.fin) })
    curseur = Math.max(curseur, i.fin)
    if (curseur >= borne.fin) break
  }
  if (curseur < borne.fin) sortie.push({ debut: curseur, fin: borne.fin })
  return sortie.filter((i) => i.fin > i.debut)
}

/**
 * Tout ce qui empêche de poser un cours ce jour-là, avec sa raison.
 *
 * Trois sources, une seule liste : les cours ailleurs, les plages fermées, et
 * — quand l'enseignant a déclaré des ouvertures — tout ce qui tombe en dehors
 * d'elles. Les trois se disent différemment à l'écran mais bloquent
 * identiquement, alors elles se calculent ensemble.
 *
 * Les ouvertures sont **recollées** avant d'être soustraites : l'écran de
 * saisie les écrit heure par heure, si bien que « libre de 8 h à 12 h » arrive
 * en quatre lignes. Les traiter séparément fermerait tout ce qui dure plus
 * d'une heure.
 */
export function occupationsDuJour(week: TeacherWeek, jour: DayOfWeek): Occupation[] {
  const sortie: Occupation[] = []

  for (const b of week.busy) {
    if (b.day !== jour) continue
    const i = versIntervalle(b.start_time, b.end_time)
    if (!i) continue
    sortie.push({
      ...i,
      motif: b.kind === "course" ? "course" : "closed",
      label: b.label,
      class_name: b.class_name,
    })
  }

  if (week.has_declarations) {
    const ouvertures = week.open
      .filter((o) => o.day === jour)
      .map((o) => versIntervalle(o.start_time, o.end_time))
      .filter((i): i is Intervalle => i !== null)
    for (const ferme of complement(ouvertures, JOURNEE)) {
      sortie.push({ ...ferme, motif: "not_open" })
    }
  }

  return sortie.sort((a, b) => a.debut - b.debut)
}

/**
 * L'espace libre autour d'un instant, ou `null` si cet instant est pris.
 *
 * C'est ce qui borne le trait : on ne peut ni commencer dans une occupation,
 * ni la traverser. La butée devient une conséquence du modèle plutôt qu'une
 * boucle qui teste heure par heure.
 */
export function creneauLibreAutour(
  occupations: Intervalle[],
  minute: number,
): Intervalle | null {
  for (const libre of complement(occupations, JOURNEE)) {
    if (minute >= libre.debut && minute < libre.fin) return libre
  }
  return null
}

/** La première occupation que croise [debut, fin[, ou `null` si la voie est libre. */
export function premierEmpechement(
  occupations: Occupation[],
  debut: number,
  fin: number,
): Occupation | null {
  return occupations.find((o) => o.debut < fin && o.fin > debut) ?? null
}
