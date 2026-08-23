"use client"

/**
 * Choisir l'heure d'un cours en la traçant sur la semaine.
 *
 * Le geste naturel — poser le doigt sur 8 h et descendre jusqu'à 10 h —
 * n'existait pas : on lisait la grille, puis on traduisait ce qu'on y avait vu
 * dans trois listes déroulantes. C'est pourtant ainsi qu'on remplit un emploi
 * du temps sur papier depuis toujours.
 *
 * Quatre décisions portent l'ergonomie :
 *
 * - **Tout se compte en minutes.** Un cours qui finit à 9 h 30 ne ferme pas
 *   l'heure de 9 h : il ferme jusqu'à 9 h 30, et on peut poser à 9 h 30. Le
 *   serveur a toujours compté ainsi ; la grille le fait enfin aussi.
 * - **Le trait est borné à l'espace libre où il commence.** Traverser un cours
 *   déjà posé est impossible, non par une garde ajoutée, mais parce qu'on ne
 *   peut pas sortir de l'intervalle où l'on est.
 * - **Le pointeur est capturé par la colonne.** C'est elle qui reçoit tous les
 *   déplacements, même hors de son cadre, et jusqu'au relâchement. Le doigt et
 *   la souris suivent donc le même chemin, et le geste n'a besoin d'aucun
 *   écouteur posé sur la fenêtre.
 * - **Un geste confisqué n'écrit rien.** `pointercancel` veut dire que le
 *   navigateur a repris la main, pas que l'utilisateur a choisi.
 */

import { useEffect, useState } from "react"
import type { DayOfWeek } from "@/lib/contracts/timetable"
import { type Intervalle, creneauLibreAutour } from "@/lib/timetable/occupation"
import { HEURE_DEBUT, HEURE_FIN, PX_PAR_HEURE, versHHMM } from "@/lib/timetable/semaine"

/** Le pas de saisie : un quart d'heure couvre les 8 h 30 et les 9 h 15. */
export const PAS_MINUTES = 15

/** Durée posée d'un simple clic, quand rien n'a été traîné. */
const DUREE_PAR_DEFAUT = 60

export interface PlageChoisie {
  jour: DayOfWeek
  /** « HH:MM », l'unité du domaine. */
  debut: string
  fin: string
}

interface Options {
  /** Ce qui bloque ce jour-là, en minutes. */
  occupationsDe: (jour: DayOfWeek) => Intervalle[]
  onCommit: (plage: PlageChoisie) => void
}

interface Trace {
  jour: DayOfWeek
  ancre: number
  tete: number
  libre: Intervalle
}

/** L'instant sous le pointeur, d'après sa hauteur dans la colonne. */
export function minuteSousLePointeur(y: number, hautColonne: number): number {
  const brute = HEURE_DEBUT * 60 + ((y - hautColonne) / PX_PAR_HEURE) * 60
  return Math.min(HEURE_FIN * 60, Math.max(HEURE_DEBUT * 60, brute))
}

const plancher = (m: number) => Math.floor(m / PAS_MINUTES) * PAS_MINUTES
const plafond = (m: number) => Math.ceil(m / PAS_MINUTES) * PAS_MINUTES

/** Ramène une valeur dans l'intervalle, en refusant les bornes inversées. */
function dansLIntervalle(v: number, libre: Intervalle): number {
  return Math.min(libre.fin, Math.max(libre.debut, v))
}

function plageDe(t: Trace): PlageChoisie {
  const debut = Math.min(t.ancre, t.tete)
  const fin = Math.max(t.ancre, t.tete)
  // Un clic sans traînée pose une heure, ou ce qui reste de libre si c'est moins.
  const etendue = fin > debut ? fin : Math.min(debut + DUREE_PAR_DEFAUT, t.libre.fin)
  return { jour: t.jour, debut: versHHMM(debut), fin: versHHMM(etendue) }
}

export function useSelectionGlissee({ occupationsDe, onCommit }: Options) {
  const [trace, setTrace] = useState<Trace | null>(null)

  const commencer = (jour: DayOfWeek, minute: number) => {
    const libre = creneauLibreAutour(occupationsDe(jour), minute)
    // Un trou plus court que le pas ne peut rien accueillir. Sans ce refus,
    // l'ancre repliee sur `fin - PAS` tomberait AVANT le debut du trou, donc
    // dans le cours qui le precede.
    if (!libre || libre.fin - libre.debut < PAS_MINUTES) return
    const ancre = dansLIntervalle(plancher(minute), {
      debut: libre.debut,
      fin: libre.fin - PAS_MINUTES,
    })
    setTrace({ jour, ancre, tete: ancre, libre })
  }

  const deplacer = (minute: number) => {
    setTrace((t) => {
      if (!t) return t
      const vise = minute >= t.ancre ? plafond(minute) : plancher(minute)
      const tete = dansLIntervalle(vise, t.libre)
      return tete === t.tete ? t : { ...t, tete }
    })
  }

  const relacher = () => {
    if (!trace) return
    setTrace(null)
    onCommit(plageDe(trace))
  }

  const abandonner = () => setTrace(null)

  // Échap reste la seule chose qui vienne du clavier : la capture du pointeur
  // s'occupe de tout le reste, y compris hors du cadre de la colonne.
  useEffect(() => {
    if (!trace) return
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTrace(null)
    }
    window.addEventListener("keydown", auClavier)
    return () => window.removeEventListener("keydown", auClavier)
  }, [trace])

  return {
    enCours: trace ? plageDe(trace) : null,
    commencer,
    deplacer,
    relacher,
    abandonner,
    glisse: trace !== null,
  }
}
