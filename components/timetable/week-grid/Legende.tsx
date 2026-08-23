"use client"

/**
 * La légende, qui doit devenir inutile.
 *
 * Chaque pastille reprend exactement l'aplat de l'état qu'elle nomme — même
 * teinte, même trame, même liseré. C'est la seule façon qu'une légende
 * apprenne quelque chose : si la pastille ne ressemble pas à la case, elle
 * ajoute une traduction au lieu d'en épargner une.
 */

import type { EtatCase } from "./etats"
import { styleDe } from "./etats"

const ENTREES: { etat: EtatCase; texte: string }[] = [
  { etat: "cours", texte: "Cours ailleurs" },
  { etat: "ferme", texte: "Indisponible" },
  { etat: "ouvert", texte: "Disponible" },
  { etat: "hors", texte: "Non déclaré" },
]

export function Legende({ avecHors }: { avecHors: boolean }) {
  const entrees = avecHors ? ENTREES : ENTREES.filter((e) => e.etat !== "hors")
  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
      {entrees.map(({ etat, texte }) => {
        const { className, style } = styleDe(etat)
        return (
          <li key={etat} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 shrink-0 rounded-[3px] ${className}`} style={style} aria-hidden />
            {texte}
          </li>
        )
      })}
      <li className="flex items-center gap-1.5">
        <span className="h-3 w-3 shrink-0 rounded-[3px] bg-orange-500 ring-1 ring-orange-600/40" aria-hidden />
        Créneau choisi
      </li>
    </ul>
  )
}
