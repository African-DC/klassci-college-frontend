"use client"

/**
 * La légende, qui doit devenir inutile.
 *
 * Deux règles la gouvernent. Chaque pastille reprend exactement l'aplat de
 * l'état qu'elle nomme — même teinte, même trame, même liseré : si la pastille
 * ne ressemble pas à la case, elle ajoute une traduction au lieu d'en épargner
 * une. Et elle ne nomme que les états **présents** dans la grille, sinon elle
 * apprend des couleurs qu'on ne verra pas et tait celle qui remplit l'écran.
 */

import type { EtatCase } from "./etats"
import { LIBELLES_LEGENDE, styleDe } from "./etats"

const ORDRE: EtatCase[] = ["cours", "ferme", "ouvert", "prefere", "hors", "libre"]

export function Legende({ etats }: { etats: ReadonlySet<EtatCase> }) {
  const presents = ORDRE.filter((e) => etats.has(e))
  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
      {presents.map((etat) => {
        const { className, style } = styleDe(etat)
        return (
          <li key={etat} className="flex items-center gap-1.5">
            <span
              className={`h-3 w-3 shrink-0 rounded-[3px] ${className}`}
              style={style}
              aria-hidden
            />
            {LIBELLES_LEGENDE[etat]}
          </li>
        )
      })}
      <li className="flex items-center gap-1.5">
        <span
          className={`h-3 w-3 shrink-0 rounded-[3px] ${styleDe("choisi").className}`}
          aria-hidden
        />
        {LIBELLES_LEGENDE.choisi}
      </li>
    </ul>
  )
}
