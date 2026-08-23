"use client"

/**
 * Choisir l'heure d'un cours en la traçant sur la semaine.
 *
 * Avant, on lisait la grille puis on traduisait ce qu'on y avait vu dans trois
 * listes déroulantes. Le geste naturel — poser le doigt sur 8 h et descendre
 * jusqu'à 10 h — n'existait pas. C'est pourtant ainsi qu'on remplit un emploi
 * du temps sur papier depuis toujours.
 *
 * Trois décisions portent l'ergonomie :
 *
 * - **La sélection bute sur les empêchements.** Traverser un cours déjà posé
 *   s'arrête à son bord. On apprend la contrainte par le geste, sans avoir lu
 *   la légende ni essuyé un refus après validation. Le geste marche dans les
 *   deux sens : on peut remonter.
 * - **On vise le point, pas la case.** Le pointeur est relu à chaque
 *   déplacement via `elementFromPoint`, si bien que la souris et le doigt
 *   suivent le même chemin — `onPointerEnter` ne se déclenche pas au toucher.
 *   La grille doit porter `touch-action: none` **avant** le contact : c'est ce
 *   qui empêche le navigateur de confisquer le geste pour faire défiler.
 * - **Un geste confisqué n'écrit rien.** `pointercancel` veut dire que le
 *   navigateur a repris la main, pas que l'utilisateur a choisi. Le confondre
 *   avec `pointerup` ferait écrire une plage que personne n'a voulue.
 */

import { useCallback, useEffect, useState } from "react"
import type { DayOfWeek } from "@/lib/contracts/timetable"
import { versHHMM } from "@/lib/timetable/semaine"

export interface PlageChoisie {
  jour: DayOfWeek
  /** « HH:MM », l'unité du domaine — pas des heures pleines qui perdraient les demies. */
  debut: string
  fin: string
}

interface Options {
  estBloquee: (jour: DayOfWeek, heure: number) => boolean
  onCommit: (plage: PlageChoisie) => void
}

interface Trace {
  jour: DayOfWeek
  ancre: number
  tete: number
}

function lireCase(x: number, y: number): { jour: DayOfWeek; heure: number } | null {
  const cible = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-heure]")
  if (!cible) return null
  const jour = cible.dataset.jour as DayOfWeek | undefined
  const heure = Number(cible.dataset.heure)
  return jour && Number.isFinite(heure) ? { jour, heure } : null
}

export function useSelectionGlissee({ estBloquee, onCommit }: Options) {
  const [trace, setTrace] = useState<Trace | null>(null)

  /** Jusqu'où on peut aller depuis l'ancre sans traverser un empêchement. */
  const borner = useCallback(
    (jour: DayOfWeek, depart: number, vise: number): number => {
      const pas = vise >= depart ? 1 : -1
      let dernier = depart
      for (let h = depart + pas; pas > 0 ? h <= vise : h >= vise; h += pas) {
        if (estBloquee(jour, h)) break
        dernier = h
      }
      return dernier
    },
    [estBloquee],
  )

  const commencer = (jour: DayOfWeek, heure: number) => {
    if (estBloquee(jour, heure)) return
    setTrace({ jour, ancre: heure, tete: heure })
  }

  const deplacer = (x: number, y: number) => {
    setTrace((t) => {
      if (!t) return t
      const sous = lireCase(x, y)
      if (!sous || sous.jour !== t.jour) return t
      const tete = borner(t.jour, t.ancre, sous.heure)
      return tete === t.tete ? t : { ...t, tete }
    })
  }

  useEffect(() => {
    if (!trace) return
    const abandonner = () => setTrace(null)
    const finir = () => {
      setTrace(null)
      onCommit({
        jour: trace.jour,
        debut: versHHMM(Math.min(trace.ancre, trace.tete)),
        fin: versHHMM(Math.max(trace.ancre, trace.tete) + 1),
      })
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

  const enCours: PlageChoisie | null = trace
    ? {
        jour: trace.jour,
        debut: versHHMM(Math.min(trace.ancre, trace.tete)),
        fin: versHHMM(Math.max(trace.ancre, trace.tete) + 1),
      }
    : null

  return { enCours, commencer, deplacer, glisse: trace !== null }
}
