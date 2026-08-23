"use client"

/**
 * La semaine d'un enseignant, en grille jour × heure.
 *
 * La grille est le contrôle, pas l'illustration : on y trace le créneau à la
 * souris ou au doigt, et les listes déroulantes du formulaire suivent. Elles
 * restent affichées — elles sont le chemin du clavier, et la confirmation de
 * ce qu'on vient de tracer.
 */

import type { DayOfWeek, TeacherWeek } from "@/lib/contracts/timetable"
import {
  HEURES,
  JOURS,
  JOURS_COURTS,
  LIBELLES,
  coursDe,
  debuteIci,
  estBloquant,
  etatDe,
  styleDe,
  versHHMM,
} from "./etats"
import { type PlageChoisie, useSelectionGlissee } from "./use-selection-glissee"

interface Props {
  week: TeacherWeek
  /** Le créneau en cours de saisie, tel que le formulaire le connaît. */
  vise?: PlageChoisie | null
  /** Absent = grille en lecture seule (portail enseignant). */
  onChoisir?: (plage: PlageChoisie) => void
}

export function SemaineGrille({ week, vise, onChoisir }: Props) {
  const bloquee = (jour: DayOfWeek, heure: number) => estBloquant(etatDe(week, jour, heure))

  const { enCours, commencer, deplacer, glisse } = useSelectionGlissee({
    estBloquee: bloquee,
    onCommit: (p) => onChoisir?.(p),
  })

  const montree = enCours ?? vise ?? null
  const interactive = Boolean(onChoisir)

  const dansSelection = (jour: DayOfWeek, heure: number) =>
    montree !== null && montree.jour === jour && heure >= montree.debut && heure < montree.fin

  return (
    <div
      className="rounded-xl border bg-card p-1.5 shadow-sm"
      onPointerMove={interactive && glisse ? (e) => deplacer(e.clientX, e.clientY) : undefined}
      style={glisse ? { touchAction: "none" } : undefined}
    >
      <div className="grid grid-cols-[2.25rem_repeat(6,minmax(0,1fr))] gap-0.5">
        <div aria-hidden />
        {JOURS.map((jour) => (
          <div
            key={jour}
            className="pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {JOURS_COURTS[jour]}
          </div>
        ))}

        {HEURES.map((heure) => (
          <div key={heure} className="contents">
            <div className="pr-1 pt-1 text-right text-[10px] font-medium tabular-nums text-muted-foreground">
              {String(heure).padStart(2, "0")}h
            </div>
            {JOURS.map((jour) => {
              const etat = etatDe(week, jour, heure)
              const choisie = dansSelection(jour, heure)
              const { className, style } = styleDe(etat)
              const cours = etat === "cours" ? coursDe(week, jour, heure) : undefined
              const etiquette = cours && debuteIci(cours.start_time, heure) ? cours : undefined

              return (
                <div
                  key={jour}
                  data-jour={jour}
                  data-heure={heure}
                  role={interactive && !estBloquant(etat) ? "button" : undefined}
                  tabIndex={-1}
                  onPointerDown={
                    interactive
                      ? (e) => {
                          e.preventDefault()
                          commencer(jour, heure)
                        }
                      : undefined
                  }
                  title={`${JOURS_COURTS[jour]} ${versHHMM(heure)} — ${LIBELLES[etat]}${
                    cours?.class_name ? ` (${cours.label}, ${cours.class_name})` : ""
                  }`}
                  className={`relative flex h-9 select-none items-center justify-center overflow-hidden rounded-md px-1 text-[10px] leading-tight transition-[background-color,box-shadow,transform] duration-150 motion-reduce:transition-none ${
                    choisie
                      ? "z-10 bg-orange-500 font-semibold text-white shadow-md ring-2 ring-orange-600/50 dark:bg-orange-500"
                      : className
                  } ${
                    interactive && !estBloquant(etat) && !choisie
                      ? "cursor-pointer hover:ring-2 hover:ring-orange-400/50"
                      : ""
                  } ${interactive && estBloquant(etat) ? "cursor-not-allowed" : ""}`}
                  style={choisie ? undefined : style}
                >
                  {choisie && heure === montree?.debut ? (
                    <span className="tabular-nums">
                      {versHHMM(montree.debut)}–{versHHMM(montree.fin)}
                    </span>
                  ) : etiquette ? (
                    <span className="truncate font-medium">
                      {etiquette.class_name ?? etiquette.label}
                    </span>
                  ) : null}
                  <span className="sr-only">
                    {JOURS_COURTS[jour]} {versHHMM(heure)} : {LIBELLES[etat]}
                    {choisie ? ", dans le créneau en cours de saisie" : ""}
                  </span>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {interactive ? (
        <p className="px-1 pb-0.5 pt-2 text-[11px] text-muted-foreground">
          Cliquez et faites glisser vers le bas pour tracer le créneau. Il s'arrête de lui-même
          au bord d'une heure occupée.
        </p>
      ) : null}
    </div>
  )
}
