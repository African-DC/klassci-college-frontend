"use client"

/**
 * La semaine d'un enseignant, en colonnes de jours.
 *
 * Même géométrie que la grille des classes : chaque occupation est un bloc
 * posé en absolu, haut de sa vraie durée. Un cours de 8 h à 8 h 30 occupe une
 * demi-case, un cours de deux heures est un seul bloc et non deux cases
 * jumelles, et son intitulé ne s'écrit qu'une fois. Les deux écrans se lisent
 * donc de la même façon, ce qui compte plus qu'on ne croit : c'est la même
 * personne qui passe de l'un à l'autre.
 *
 * La grille est aussi le contrôle : on y trace le créneau, et les listes
 * déroulantes du formulaire suivent. Elles restent le chemin du clavier.
 */

import { useRef } from "react"
import { cn } from "@/lib/utils"
import type { DayOfWeek, TeacherWeek } from "@/lib/contracts/timetable"
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
import { LIBELLES, estBloquant, etatDe, styleDe } from "./etats"
import { type PlageChoisie, heureSousLePointeur, useSelectionGlissee } from "./use-selection-glissee"

const HAUTEUR = (HEURE_FIN - HEURE_DEBUT) * PX_PAR_HEURE

interface Props {
  week: TeacherWeek
  /** Le créneau en cours de saisie, en « HH:MM » comme le formulaire le tient. */
  vise?: PlageChoisie | null
  /** Absent = grille en lecture seule (portail enseignant). */
  onChoisir?: (plage: PlageChoisie) => void
}

/** Le rectangle d'une plage « HH:MM », borné à l'amplitude affichée. */
function rectangle(debut: string, fin: string): { top: number; height: number } | null {
  const d = enMinutes(debut)
  const f = enMinutes(fin)
  if (d === null || f === null || f <= d) return null
  const haut = Math.max(0, minutesEnPx(d))
  const bas = Math.min(HAUTEUR, minutesEnPx(f))
  return bas <= haut ? null : { top: haut, height: bas - haut }
}

export function SemaineGrille({ week, vise, onChoisir }: Props) {
  const colonnes = useRef<HTMLDivElement | null>(null)
  const bloquee = (jour: DayOfWeek, heure: number) => estBloquant(etatDe(week, jour, heure))

  const { enCours, commencer, deplacer, glisse } = useSelectionGlissee({
    estBloquee: bloquee,
    onCommit: (p) => onChoisir?.(p),
  })

  const montree = enCours ?? vise ?? null
  const interactive = Boolean(onChoisir)
  const styleFerme = styleDe("ferme")
  const styleHors = styleDe("hors")
  const styleOuvert = styleDe("ouvert")

  const heureDe = (clientY: number) => {
    const haut = colonnes.current?.getBoundingClientRect().top ?? 0
    return heureSousLePointeur(clientY, haut)
  }

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
        {/* Colonne des heures */}
        <div className="relative w-9 shrink-0" style={{ height: HAUTEUR }}>
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
          ref={colonnes}
          className="relative flex flex-1 gap-1"
          style={{ height: HAUTEUR, ...(interactive ? { touchAction: "none" } : {}) }}
          onPointerMove={interactive && glisse ? (e) => deplacer(heureDe(e.clientY)) : undefined}
        >
          {/* Les filets d'heures, en fond */}
          {HEURES.map((heure) => (
            <div
              key={heure}
              className="pointer-events-none absolute inset-x-0 border-t border-border/40"
              style={{ top: minutesEnPx(heure * 60) }}
              aria-hidden
            />
          ))}

          {JOURS.map((jour) => {
            const cours = week.busy.filter((b) => b.day === jour && b.kind === "course")
            const fermetures = week.busy.filter((b) => b.day === jour && b.kind === "unavailable")
            const ouvertures = week.open.filter((o) => o.day === jour)
            const selection =
              montree?.jour === jour ? rectangle(montree.debut, montree.fin) : null

            return (
              <div
                key={jour}
                className={cn(
                  "relative flex-1 rounded-md",
                  week.has_declarations ? "" : "bg-muted/20",
                  interactive && "cursor-pointer",
                )}
                style={week.has_declarations ? styleHors.style : undefined}
                onPointerDown={
                  interactive
                    ? (e) => {
                        e.preventDefault()
                        e.currentTarget.setPointerCapture(e.pointerId)
                        commencer(jour, heureDe(e.clientY))
                      }
                    : undefined
                }
              >
                {ouvertures.map((o) => {
                  const r = rectangle(o.start_time, o.end_time)
                  return r ? (
                    <div
                      key={`o-${o.start_time}`}
                      className={cn("absolute inset-x-0 rounded", styleOuvert.className)}
                      style={{ top: r.top, height: r.height }}
                      title={`Disponible de ${o.start_time} à ${o.end_time}`}
                    />
                  ) : null
                })}

                {fermetures.map((f) => {
                  const r = rectangle(f.start_time, f.end_time)
                  return r ? (
                    <div
                      key={`f-${f.start_time}`}
                      className={cn(
                        "absolute inset-x-0 flex items-center justify-center rounded text-[9px]",
                        styleFerme.className,
                      )}
                      style={{ top: r.top, height: r.height, ...styleFerme.style }}
                      title={`Indisponible de ${f.start_time} à ${f.end_time}`}
                    >
                      <span className="sr-only">
                        Indisponible de {f.start_time} à {f.end_time}
                      </span>
                    </div>
                  ) : null
                })}

                {cours.map((c) => {
                  const r = rectangle(c.start_time, c.end_time)
                  if (!r) return null
                  return (
                    <div
                      key={`c-${c.start_time}`}
                      className="absolute inset-x-0 overflow-hidden rounded border border-sky-700/25 bg-sky-600/90 px-1 py-0.5 text-white shadow-sm dark:bg-sky-500/80"
                      style={{ top: r.top + 1, height: r.height - 2 }}
                      title={`${c.label}${c.class_name ? ` · ${c.class_name}` : ""} de ${c.start_time} à ${c.end_time}`}
                    >
                      <p className="truncate text-[10px] font-semibold leading-tight">
                        {c.class_name ?? c.label}
                      </p>
                      {r.height >= 38 && (
                        <p className="truncate text-[9px] leading-tight opacity-80">{c.label}</p>
                      )}
                      {r.height >= 54 && (
                        <p className="text-[9px] leading-tight tabular-nums opacity-70">
                          {c.start_time}–{c.end_time}
                        </p>
                      )}
                    </div>
                  )
                })}

                {selection && (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-10 flex items-center justify-center rounded bg-orange-500 text-[10px] font-semibold text-white shadow-md ring-2 ring-inset ring-orange-600/50"
                    style={{ top: selection.top + 1, height: selection.height - 2 }}
                  >
                    <span className="tabular-nums">
                      {montree!.debut}–{montree!.fin}
                    </span>
                  </div>
                )}

                <span className="sr-only">
                  {JOURS_COURTS[jour]} :{" "}
                  {cours.length === 0 && fermetures.length === 0
                    ? LIBELLES[week.has_declarations ? "hors" : "libre"]
                    : [
                        ...cours.map(
                          (c) =>
                            `${c.label}${c.class_name ? ` avec la ${c.class_name}` : ""} de ${c.start_time} à ${c.end_time}`,
                        ),
                        ...fermetures.map(
                          (f) => `indisponible de ${f.start_time} à ${f.end_time}`,
                        ),
                      ].join(", ")}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {interactive ? (
        <p className="px-1 pb-0.5 pt-2 text-[11px] text-muted-foreground">
          Cliquez et faites glisser vers le haut ou vers le bas pour tracer le créneau. Il
          s&apos;arrête de lui-même au bord d&apos;une heure occupée.
        </p>
      ) : null}
    </div>
  )
}
