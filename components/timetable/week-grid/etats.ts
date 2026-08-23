/**
 * Ce qu'une case de la semaine raconte, et comment elle le montre.
 *
 * Cinq états, distingués par la **matière** et pas seulement par la teinte :
 * un aplat plein n'est pas une trame, et une trame n'est pas un fond vide. On
 * doit pouvoir lire la grille sans la légende, et la lire quand même quand on
 * ne distingue pas le rouge du vert — ce qui concerne un homme sur douze.
 */

import type { CSSProperties } from "react"
import type { DayOfWeek, TeacherWeek } from "@/lib/contracts/timetable"
import { enMinutes } from "@/lib/timetable/week-overlap"

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

export type EtatCase = "libre" | "cours" | "ferme" | "ouvert" | "hors"

/** Les états qu'on ne peut pas recouvrir d'un cours. */
export function estBloquant(etat: EtatCase): boolean {
  return etat === "cours" || etat === "ferme" || etat === "hors"
}

export const LIBELLES: Record<EtatCase, string> = {
  libre: "libre",
  cours: "occupé par un autre cours",
  ferme: "indisponible, déclaré",
  ouvert: "disponible, déclaré",
  hors: "hors des plages déclarées",
}

/**
 * L'aplat de chaque état.
 *
 * `cours` est le seul plein : c'est le seul empêchement qui porte un contenu,
 * un vrai cours avec sa classe. `ferme` est hachuré parce qu'une hachure se
 * lit « barré » dans toutes les cultures. `hors` est une trame plus pâle : ce
 * n'est pas un refus, c'est une absence d'offre. `ouvert` est le seul état
 * accueillant, et il reste discret pour ne pas concurrencer la sélection.
 */
export function styleDe(etat: EtatCase): { className: string; style?: CSSProperties } {
  switch (etat) {
    case "cours":
      return {
        className:
          "bg-sky-600/90 text-white shadow-sm ring-1 ring-inset ring-sky-700/30 dark:bg-sky-500/80",
      }
    case "ferme":
      return {
        className: "text-rose-900/70 ring-1 ring-inset ring-rose-400/40 dark:text-rose-100/70",
        style: {
          backgroundImage:
            "repeating-linear-gradient(45deg, rgb(244 63 94 / 0.28) 0 2px, transparent 2px 6px)",
          backgroundColor: "rgb(244 63 94 / 0.07)",
        },
      }
    case "hors":
      return {
        className: "ring-1 ring-inset ring-border/60",
        style: {
          backgroundImage:
            "repeating-linear-gradient(45deg, rgb(100 116 139 / 0.16) 0 2px, transparent 2px 7px)",
        },
      }
    case "ouvert":
      return {
        className: "bg-emerald-500/12 ring-1 ring-inset ring-emerald-500/25",
      }
    default:
      return { className: "bg-muted/25 ring-1 ring-inset ring-border/40" }
  }
}

function couvre(debut: string, fin: string, heure: number): boolean {
  const d = enMinutes(debut)
  const f = enMinutes(fin)
  return d !== null && f !== null && d < (heure + 1) * 60 && f > heure * 60
}

export function etatDe(week: TeacherWeek, jour: DayOfWeek, heure: number): EtatCase {
  if (week.busy.some((b) => b.day === jour && b.kind === "course" && couvre(b.start_time, b.end_time, heure)))
    return "cours"
  if (
    week.busy.some(
      (b) => b.day === jour && b.kind === "unavailable" && couvre(b.start_time, b.end_time, heure),
    )
  )
    return "ferme"
  if (week.open.some((o) => o.day === jour && couvre(o.start_time, o.end_time, heure))) return "ouvert"
  return week.has_declarations ? "hors" : "libre"
}

/** Le cours qui occupe cette heure, s'il y en a un — pour l'étiqueter. */
export function coursDe(week: TeacherWeek, jour: DayOfWeek, heure: number) {
  return week.busy.find(
    (b) => b.day === jour && b.kind === "course" && couvre(b.start_time, b.end_time, heure),
  )
}

/**
 * Cette heure est-elle la **première** du cours qui l'occupe ?
 *
 * Un cours de deux heures ne doit porter son étiquette qu'une fois : répétée,
 * elle se lit comme deux cours.
 */
export function debuteIci(debut: string, heure: number): boolean {
  const d = enMinutes(debut)
  return d !== null && d >= heure * 60 && d < (heure + 1) * 60
}

export function versHHMM(heure: number): string {
  return `${String(heure).padStart(2, "0")}:00`
}
