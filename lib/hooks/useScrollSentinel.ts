"use client"

import { useEffect, useRef } from "react"

interface Options {
  /** Faux quand il n'y a plus rien à charger, ou qu'un chargement court déjà. */
  actif: boolean
  onApproche: () => void
  /** Distance avant le bas à laquelle on déclenche. */
  marge?: string
}

/**
 * Déclenche un chargement quand la sentinelle approche du bas de l'écran.
 *
 * La marge par défaut est volontairement courte. Sur une connexion lente, une
 * marge généreuse charge des pages que personne n'a demandées et que personne
 * ne lira : on paie des données pour du contenu dépassé au moment où il
 * arrive. Deux cents pixels laissent le temps de charger sans devancer
 * l'intention de la personne.
 *
 * `actif` doit passer à faux pendant un chargement, sinon l'observateur
 * redéclenche à chaque frame tant que la sentinelle reste visible, et on
 * demande la même page cinq fois.
 */
export function useScrollSentinel({ actif, onApproche, marge = "200px" }: Options) {
  const sentinelle = useRef<HTMLDivElement | null>(null)
  // Gardée dans une ref pour que changer de rappel ne recree pas l'observateur
  // a chaque rendu, ce qui le ferait declencher a nouveau.
  const rappel = useRef(onApproche)
  rappel.current = onApproche

  useEffect(() => {
    const cible = sentinelle.current
    if (!cible || !actif) return

    const observateur = new IntersectionObserver(
      (entrees) => {
        if (entrees[0]?.isIntersecting) rappel.current()
      },
      { rootMargin: marge },
    )
    observateur.observe(cible)
    return () => observateur.disconnect()
  }, [actif, marge])

  return sentinelle
}
