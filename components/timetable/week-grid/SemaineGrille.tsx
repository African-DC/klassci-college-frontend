"use client"

/**
 * La semaine d'un enseignant, en grille jour × heure.
 *
 * La grille est le contrôle, pas l'illustration : on y trace le créneau à la
 * souris ou au doigt, et les listes déroulantes du formulaire suivent. Elles
 * restent affichées — elles sont le chemin du clavier, et la confirmation de
 * ce qu'on vient de tracer.
 *
 * Le tableau reste un vrai `<table>` avec ses en-têtes de ligne et de colonne :
 * une grille jour × heure se lit à la voix par ses en-têtes, et la remplacer
 * par des `<div>` reviendrait à débiter soixante-six cases sans repère.
 */

import { cn } from "@/lib/utils"
import type { DayOfWeek, TeacherWeek } from "@/lib/contracts/timetable"
import { HEURES, JOURS, JOURS_COURTS, couvre } from "@/lib/timetable/semaine"
import { LIBELLES, coursDe, debuteIci, estBloquant, etatDe, styleDe } from "./etats"
import { type PlageChoisie, useSelectionGlissee } from "./use-selection-glissee"

interface Props {
  week: TeacherWeek
  /** Le créneau en cours de saisie, en « HH:MM » comme le formulaire le tient. */
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

  // Le meme test de recouvrement que pour tous les autres etats : arrondir a
  // l'heure ferait disparaitre un creneau de 08:00 a 08:30.
  const dansSelection = (jour: DayOfWeek, heure: number) =>
    montree !== null && montree.jour === jour && couvre(montree.debut, montree.fin, heure)

  return (
    <div
      className="rounded-xl border bg-card p-1.5 shadow-sm"
      onPointerMove={interactive && glisse ? (e) => deplacer(e.clientX, e.clientY) : undefined}
      // Pose avant le contact, sinon le navigateur a deja decide de faire
      // defiler et confisque le geste des le premier deplacement du doigt.
      style={interactive ? { touchAction: "none" } : undefined}
    >
      <table className="w-full table-fixed border-separate border-spacing-0.5">
        <caption className="sr-only">
          Occupation de la semaine de {week.teacher_name}, par jour et par heure
        </caption>
        <thead>
          <tr>
            <th scope="col" className="w-9">
              <span className="sr-only">Heure</span>
            </th>
            {JOURS.map((jour) => (
              <th
                key={jour}
                scope="col"
                className="pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {JOURS_COURTS[jour]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HEURES.map((heure) => (
            <tr key={heure}>
              <th
                scope="row"
                className="pr-1 text-right align-middle text-[10px] font-medium tabular-nums text-muted-foreground"
              >
                {String(heure).padStart(2, "0")}h
              </th>
              {JOURS.map((jour) => {
                const etat = etatDe(week, jour, heure)
                const bloque = estBloquant(etat)
                const choisie = dansSelection(jour, heure)
                const { className, style } = styleDe(etat)
                const cours = etat === "cours" ? coursDe(week, jour, heure) : undefined
                const etiquette = cours && debuteIci(cours.start_time, heure) ? cours : undefined

                return (
                  <td key={jour} className="p-0">
                    <div
                      data-jour={jour}
                      data-heure={heure}
                      onPointerDown={
                        interactive
                          ? (e) => {
                              e.preventDefault()
                              commencer(jour, heure)
                            }
                          : undefined
                      }
                      title={`${JOURS_COURTS[jour]} ${String(heure).padStart(2, "0")}h — ${
                        LIBELLES[etat]
                      }${cours?.class_name ? ` (${cours.label}, ${cours.class_name})` : ""}`}
                      className={cn(
                        "relative flex h-11 select-none items-center justify-center overflow-hidden rounded-md px-1 text-[10px] leading-tight transition-[background-color,box-shadow] duration-150 motion-reduce:transition-none lg:h-9",
                        choisie
                          ? "bg-orange-500 font-semibold text-white shadow-md ring-2 ring-inset ring-orange-600/50"
                          : className,
                        interactive && !bloque && !choisie && "cursor-pointer hover:ring-2 hover:ring-orange-400/50",
                        interactive && bloque && "cursor-not-allowed",
                      )}
                      style={choisie ? undefined : style}
                    >
                      {choisie && montree && debuteIci(montree.debut, heure) ? (
                        <span className="tabular-nums">
                          {montree.debut}–{montree.fin}
                        </span>
                      ) : etiquette ? (
                        <span className="truncate font-medium">
                          {etiquette.class_name ?? etiquette.label}
                        </span>
                      ) : null}
                      <span className="sr-only">
                        {LIBELLES[etat]}
                        {choisie ? ", dans le créneau en cours de saisie" : ""}
                      </span>
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {interactive ? (
        <p className="px-1 pb-0.5 pt-2 text-[11px] text-muted-foreground">
          Cliquez et faites glisser vers le haut ou vers le bas pour tracer le créneau. Il
          s&apos;arrête de lui-même au bord d&apos;une heure occupée.
        </p>
      ) : null}
    </div>
  )
}
