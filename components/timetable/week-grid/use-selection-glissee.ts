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
 *   peut pas sortir de l'intervalle où l'on est. La butée est une conséquence
 *   du modèle, pas une boucle qui teste heure par heure.
 * - **On lit l'instant dans la hauteur.** La colonne du jour est une seule
 *   surface : le doigt et la souris suivent le même chemin, sans dépendre du
 *   survol, qui n'existe pas au toucher.
 * - **Un geste confisqué n'écrit rien.** `pointercancel` veut dire que le
 *   navigateur a repris la main, pas que l'utilisateur a choisi.
 */

import { useEffect, useState } from "react"
import type { DayOfWeek } from "@/lib/contracts/timetable"
import { type Intervalle, creneauLibreAutour } from "@/lib/timetable/occupation"
import { HEURE_DEBUT, HEURE_FIN, PX_PAR_HEURE } from "@/lib/timetable/semaine"

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

export function versHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

/** L'instant sous le pointeur, d'après sa hauteur dans la colonne. */
export function minuteSousLePointeur(y: number, hautColonne: number): number {
  const brute = HEURE_DEBUT * 60 + ((y - hautColonne) / PX_PAR_HEURE) * 60
  return Math.min(HEURE_FIN * 60, Math.max(HEURE_DEBUT * 60, brute))
}

const plancher = (m: number) => Math.floor(m / PAS_MINUTES) * PAS_MINUTES
const plafond = (m: number) => Math.ceil(m / PAS_MINUTES) * PAS_MINUTES
const borner = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

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
    if (!libre) return
    const ancre = borner(plancher(minute), libre.debut, libre.fin - PAS_MINUTES)
    setTrace({ jour, ancre, tete: ancre, libre })
  }

  const deplacer = (minute: number) => {
    setTrace((t) => {
      if (!t) return t
      const vise = minute >= t.ancre ? plafond(minute) : plancher(minute)
      const tete = borner(vise, t.libre.debut, t.libre.fin)
      return tete === t.tete ? t : { ...t, tete }
    })
  }

  useEffect(() => {
    if (!trace) return
    const abandonner = () => setTrace(null)
    const finir = () => {
      setTrace(null)
      onCommit(plageDe(trace))
    }
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === "Escape") abandonner()
    }
    window.addEventListener("pointerup", finir)
    window.addEventListener("pointercancel", abandonner)
    window.addEventListener("keydown", auClavier)
    return () => {
      window.removeEventListener("pointerup", finir)
      window.removeEventListener("pointercancel", abandonner)
      window.removeEventListener("keydown", auClavier)
    }
  }, [trace, onCommit])

  return {
    enCours: trace ? plageDe(trace) : null,
    commencer,
    deplacer,
    glisse: trace !== null,
  }
}
