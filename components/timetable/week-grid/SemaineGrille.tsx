"use client"

/**
 * La semaine d'un enseignant, en colonnes de jours.
 *
 * Même géométrie que la grille des classes, pour que les deux écrans se lisent
 * de la même façon : c'est la même personne qui passe de l'un à l'autre.
 *
 * La grille est aussi le contrôle : on y trace le créneau, et les listes
 * déroulantes du formulaire suivent. Elles restent le chemin du clavier, ce
 * que le texte sous la grille dit explicitement.
 */

import { useRef } from "react"
import type { TeacherWeek } from "@/lib/contracts/timetable"
import { type Intervalle, occupationsDuJour } from "@/lib/timetable/occupation"
import {
  HEURES,
  HEURE_DEBUT,
  HEURE_FIN,
  JOURS,
  JOURS_COURTS,
  PX_PAR_HEURE,
  enMinutes,
  minutesEnPx,
} from "@/lib/timetable/semaine"
import { ColonneDuJour } from "./ColonneDuJour"
import {
  type PlageChoisie,
  minuteSousLePointeur,
  useSelectionGlissee,
} from "./use-selection-glissee"

const HAUTEUR = (HEURE_FIN - HEURE_DEBUT) * PX_PAR_HEURE

interface Props {
  week: TeacherWeek
  /** Le créneau en cours de saisie, en « HH:MM » comme le formulaire le tient. */
  vise?: PlageChoisie | null
  /** Absent = grille en lecture seule (portail enseignant). */
  onChoisir?: (plage: PlageChoisie) => void
}

function versIntervalle(debut: string, fin: string): Intervalle | null {
  const d = enMinutes(debut)
  const f = enMinutes(fin)
  return d === null || f === null || f <= d ? null : { debut: d, fin: f }
}

export function SemaineGrille({ week, vise, onChoisir }: Props) {
  const cadre = useRef<HTMLDivElement | null>(null)
  const interactive = Boolean(onChoisir)

  const { enCours, commencer, deplacer, relacher, abandonner } = useSelectionGlissee({
    occupationsDe: (jour) => occupationsDuJour(week, jour),
    onCommit: (p) => onChoisir?.(p),
  })

  const montree = enCours ?? vise ?? null
  const selection = montree ? versIntervalle(montree.debut, montree.fin) : null
  const minuteDe = (clientY: number) =>
    minuteSousLePointeur(clientY, cadre.current?.getBoundingClientRect().top ?? 0)

  return (
    <div className="rounded-xl border bg-card p-2 shadow-sm">
      <div className="flex">
        <div className="w-9 shrink-0" aria-hidden />
        {JOURS.map((jour) => (
          <div
            key={jour}
            className="flex-1 pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {JOURS_COURTS[jour]}
          </div>
        ))}
      </div>

      <div className="flex">
        <div className="relative w-9 shrink-0" style={{ height: HAUTEUR }} aria-hidden>
          {HEURES.map((heure) => (
            <span
              key={heure}
              className="absolute right-1 -translate-y-1/2 text-[10px] font-medium tabular-nums text-muted-foreground"
              style={{ top: minutesEnPx(heure * 60) }}
            >
              {String(heure).padStart(2, "0")}h
            </span>
          ))}
        </div>

        <div
          ref={cadre}
          className="relative flex flex-1 gap-1"
          style={{ height: HAUTEUR, ...(interactive ? { touchAction: "none" } : {}) }}
        >
          {HEURES.map((heure) => (
            <div
              key={heure}
              className="pointer-events-none absolute inset-x-0 border-t border-border/40"
              style={{ top: minutesEnPx(heure * 60) }}
              aria-hidden
            />
          ))}

          {JOURS.map((jour) => (
            <ColonneDuJour
              key={jour}
              jour={jour}
              hauteur={HAUTEUR}
              occupations={occupationsDuJour(week, jour)}
              ouvertures={week.open
                .filter((o) => o.day === jour)
                .map((o) => versIntervalle(o.start_time, o.end_time))
                .filter((i): i is Intervalle => i !== null)}
              selection={montree?.jour === jour ? selection : null}
              gestes={
                interactive
                  ? {
                      onPointerDown: (e) => {
                        e.preventDefault()
                        e.currentTarget.setPointerCapture(e.pointerId)
                        commencer(jour, minuteDe(e.clientY))
                      },
                      onPointerMove: (e) => deplacer(minuteDe(e.clientY)),
                      onPointerUp: relacher,
                      onPointerCancel: abandonner,
                    }
                  : undefined
              }
            />
          ))}
        </div>
      </div>

      {interactive ? (
        <p className="px-1 pb-0.5 pt-2 text-[11px] text-muted-foreground">
          Cliquez et faites glisser vers le haut ou vers le bas pour tracer le créneau. Il
          s&apos;arrête de lui-même au bord d&apos;une heure occupée. Le jour et les heures se
          saisissent aussi dans les champs ci-contre.
        </p>
      ) : null}
    </div>
  )
}
