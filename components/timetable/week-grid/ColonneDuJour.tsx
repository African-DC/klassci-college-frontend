"use client"

/**
 * Une journée de la semaine, avec ce qui l'occupe.
 *
 * Chaque occupation est un bloc posé en absolu, haut de sa vraie durée — la
 * géométrie de la grille des classes. Un cours de 8 h à 8 h 30 occupe une
 * demi-case, un cours de deux heures est un seul bloc et non deux cases
 * jumelles, et son intitulé ne s'écrit qu'une fois.
 *
 * La colonne est aussi la surface de saisie : elle capture le pointeur et
 * traduit sa hauteur en instant. Elle porte enfin le résumé lu à voix haute,
 * construit à partir des occupations et des espaces libres réels — dire « hors
 * des plages déclarées » un jour où l'enseignant est justement disponible
 * serait pire que de se taire.
 */

import type { PointerEvent as ReactPointerEvent } from "react"
import { cn } from "@/lib/utils"
import type { DayOfWeek } from "@/lib/contracts/timetable"
import {
  JOURNEE,
  type Intervalle,
  type Occupation,
  complement,
} from "@/lib/timetable/occupation"
import { JOURS_COURTS, minutesEnPx, versHHMM } from "@/lib/timetable/semaine"
import { ETAT_DE_MOTIF, LIBELLES, styleDe } from "./etats"

interface Props {
  jour: DayOfWeek
  occupations: Occupation[]
  /** Les plages explicitement déclarées ouvertes, à signaler en fond. */
  ouvertures: Intervalle[]
  /** Le créneau en cours de saisie sur cette colonne, s'il y en a un. */
  selection: Intervalle | null
  hauteur: number
  /** Sans ces gestes, la colonne est en lecture seule. */
  gestes?: {
    onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void
    onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => void
    onPointerUp: () => void
    onPointerCancel: () => void
  }
}

function rectangle(i: Intervalle, hauteur: number) {
  const haut = Math.max(0, minutesEnPx(i.debut))
  const bas = Math.min(hauteur, minutesEnPx(i.fin))
  return bas <= haut ? null : { top: haut, height: bas - haut }
}

/** Ce que la colonne raconte à voix haute, sans jamais inverser le sens. */
function resume(occupations: Occupation[], libres: Intervalle[]): string {
  if (occupations.length === 0) return "libre toute la journée"
  const dits = occupations.map((o) => {
    const de = `de ${versHHMM(o.debut)} à ${versHHMM(o.fin)}`
    const quoi =
      o.motif === "course"
        ? `${o.label}${o.class_name ? ` avec la ${o.class_name}` : ""}`
        : LIBELLES[ETAT_DE_MOTIF[o.motif]]
    return `${quoi} ${de}`
  })
  const restant = libres.map((l) => `libre de ${versHHMM(l.debut)} à ${versHHMM(l.fin)}`)
  return [...dits, ...restant].join(", ")
}

export function ColonneDuJour({
  jour,
  occupations,
  ouvertures,
  selection,
  hauteur,
  gestes,
}: Props) {
  const libres = complement(occupations, JOURNEE)
  const styleOuvert = styleDe("ouvert")

  return (
    <div
      role="img"
      aria-label={`${JOURS_COURTS[jour]} : ${resume(occupations, libres)}`}
      className={cn("relative flex-1 rounded-md", styleDe("libre").className, gestes && "cursor-pointer")}
      {...gestes}
    >
      {ouvertures.map((o) => {
        const r = rectangle(o, hauteur)
        return r ? (
          <div
            key={`o-${o.debut}`}
            className={cn("absolute inset-x-0 rounded", styleOuvert.className)}
            style={{ top: r.top, height: r.height, ...styleOuvert.style }}
            aria-hidden
          />
        ) : null
      })}

      {occupations.map((o) => {
        const r = rectangle(o, hauteur)
        if (!r) return null
        const style = styleDe(ETAT_DE_MOTIF[o.motif])
        const quoi =
          o.motif === "course"
            ? `${o.label}${o.class_name ? ` · ${o.class_name}` : ""}`
            : LIBELLES[ETAT_DE_MOTIF[o.motif]]
        const titre = `${quoi} de ${versHHMM(o.debut)} à ${versHHMM(o.fin)}`

        return (
          <div
            key={`${o.motif}-${o.debut}`}
            className={cn("absolute inset-x-0 overflow-hidden rounded px-1", style.className)}
            style={{ top: r.top + 1, height: r.height - 2, ...style.style }}
            title={titre}
            aria-hidden
          >
            {o.motif === "course" && (
              <>
                <p className="truncate py-0.5 text-[10px] font-semibold leading-tight">
                  {o.class_name ?? o.label}
                </p>
                {r.height >= 38 && (
                  <p className="truncate text-[9px] leading-tight opacity-80">{o.label}</p>
                )}
                {r.height >= 54 && (
                  <p className="text-[9px] leading-tight tabular-nums opacity-70">
                    {versHHMM(o.debut)}–{versHHMM(o.fin)}
                  </p>
                )}
              </>
            )}
          </div>
        )
      })}

      {selection &&
        (() => {
          const r = rectangle(selection, hauteur)
          return r ? (
            <div
              className={cn(
                "pointer-events-none absolute inset-x-0 z-10 flex items-center justify-center rounded text-[10px]",
                styleDe("choisi").className,
              )}
              style={{ top: r.top + 1, height: r.height - 2 }}
            >
              <span className="tabular-nums">
                {versHHMM(selection.debut)}–{versHHMM(selection.fin)}
              </span>
            </div>
          ) : null
        })()}
    </div>
  )
}
