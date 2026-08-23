"use client"

/**
 * Choisir l'heure d'un cours en la traçant sur la semaine.
 *
 * Avant, on lisait la grille puis on traduisait ce qu'on y avait vu dans trois
 * listes déroulantes. Le geste naturel — poser le doigt sur 8 h et descendre
 * jusqu'à 10 h — n'existait pas. C'est pourtant ainsi qu'on remplit un emploi
 * du temps sur papier depuis toujours.
 *
 * Deux décisions portent l'ergonomie :
 *
 * - **La sélection bute sur les empêchements.** Descendre à travers un cours
 *   déjà posé s'arrête à son bord. On apprend la contrainte par le geste,
 *   sans avoir lu la légende ni essuyé un refus après validation.
 * - **On vise le point, pas la case.** Le pointeur est relu à chaque
 *   déplacement via `elementFromPoint`, si bien que la souris et le doigt
 *   suivent le même chemin — `onPointerEnter` ne se déclenche pas au toucher,
 *   et la tablette serait restée sur le carreau.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import type { DayOfWeek } from "@/lib/contracts/timetable"

export interface PlageChoisie {
  jour: DayOfWeek
  /** Heures pleines ; `fin` est exclusive (8 → 10 se lit « 08:00 à 10:00 »). */
  debut: number
  fin: number
}

interface Options {
  /** Une case sur laquelle on ne peut ni commencer ni s'étendre. */
  estBloquee: (jour: DayOfWeek, heure: number) => boolean
  onCommit: (plage: PlageChoisie) => void
}

interface Ancre {
  jour: DayOfWeek
  heure: number
}

function lireCase(x: number, y: number): Ancre | null {
  const cible = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-heure]")
  if (!cible) return null
  const jour = cible.dataset.jour as DayOfWeek | undefined
  const heure = Number(cible.dataset.heure)
  return jour && Number.isFinite(heure) ? { jour, heure } : null
}

export function useSelectionGlissee({ estBloquee, onCommit }: Options) {
  const [ancre, setAncre] = useState<Ancre | null>(null)
  const [tete, setTete] = useState<number | null>(null)
  const ancreRef = useRef<Ancre | null>(null)
  const teteRef = useRef<number | null>(null)

  ancreRef.current = ancre
  teteRef.current = tete

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

  const commencer = useCallback(
    (jour: DayOfWeek, heure: number) => {
      if (estBloquee(jour, heure)) return
      setAncre({ jour, heure })
      setTete(heure)
    },
    [estBloquee],
  )

  const deplacer = useCallback(
    (x: number, y: number) => {
      const depart = ancreRef.current
      if (!depart) return
      const sous = lireCase(x, y)
      if (!sous || sous.jour !== depart.jour) return
      setTete(borner(depart.jour, depart.heure, sous.heure))
    },
    [borner],
  )

  useEffect(() => {
    if (!ancre) return
    const finir = () => {
      const depart = ancreRef.current
      const fin = teteRef.current
      setAncre(null)
      setTete(null)
      if (!depart || fin === null) return
      onCommit({
        jour: depart.jour,
        debut: Math.min(depart.heure, fin),
        fin: Math.max(depart.heure, fin) + 1,
      })
    }
    const annuler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      setAncre(null)
      setTete(null)
    }
    window.addEventListener("pointerup", finir)
    window.addEventListener("pointercancel", finir)
    window.addEventListener("keydown", annuler)
    return () => {
      window.removeEventListener("pointerup", finir)
      window.removeEventListener("pointercancel", finir)
      window.removeEventListener("keydown", annuler)
    }
  }, [ancre, onCommit])

  const enCours: PlageChoisie | null =
    ancre && tete !== null
      ? {
          jour: ancre.jour,
          debut: Math.min(ancre.heure, tete),
          fin: Math.max(ancre.heure, tete) + 1,
        }
      : null

  return { enCours, commencer, deplacer, glisse: ancre !== null }
}
