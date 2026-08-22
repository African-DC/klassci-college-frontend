"use client"

/**
 * La semaine d'un enseignant, montrée pendant qu'on lui pose un créneau.
 *
 * Deux tailles d'écran, deux lectures du même contenu, parce qu'aucune ne
 * marche partout : sur un écran large, une grille jour × heure se balaie d'un
 * regard ; sur un téléphone, elle se réduit à des cases illisibles, alors on
 * liste les empêchements jour par jour. Le composant ne choisit pas à la
 * place du navigateur, il rend les deux et laisse les points de rupture
 * décider.
 */

import Link from "next/link"
import type { Route } from "next"
import { AlertTriangle, CalendarX2, Check, Info, SquarePen } from "lucide-react"
import type { DayOfWeek, TeacherWeek } from "@/lib/contracts/timetable"
import { JOURS_FR, enMinutes, versJourAnglais } from "@/lib/timetable/week-overlap"
import { Skeleton } from "@/components/ui/skeleton"

const JOURS: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

const JOURS_COURTS: Record<DayOfWeek, string> = {
  monday: "Lun",
  tuesday: "Mar",
  wednesday: "Mer",
  thursday: "Jeu",
  friday: "Ven",
  saturday: "Sam",
}

/** 7 h à 18 h : l'amplitude d'une journée de collège ivoirien. */
const HEURES = Array.from({ length: 11 }, (_, i) => 7 + i)

type EtatCase = "libre" | "cours" | "ferme" | "ouvert" | "hors"

const STYLES: Record<EtatCase, string> = {
  libre: "bg-muted/40",
  cours: "bg-sky-500/25 ring-1 ring-inset ring-sky-500/40",
  ferme: "bg-rose-500/20 ring-1 ring-inset ring-rose-400/40",
  ouvert: "bg-emerald-500/20 ring-1 ring-inset ring-emerald-500/30",
  hors: "bg-muted/70",
}

const LIBELLES: Record<EtatCase, string> = {
  libre: "libre",
  cours: "cours",
  ferme: "indisponible",
  ouvert: "disponible",
  hors: "hors des plages déclarées",
}

interface TeacherWeekPanelProps {
  week: TeacherWeek | undefined
  isLoading?: boolean
  /** Jour visé par la saisie en cours, en français ou en anglais. */
  highlightDay?: string
  highlightStart?: string
  highlightEnd?: string
  /** Titre facultatif — le portail enseignant parle à la première personne. */
  title?: string
  /**
   * Affiche un lien vers la fiche de l'enseignant pour y corriger ses plages.
   *
   * L'administration a le droit de les saisir à sa place — chez ROSTAN c'est
   * le directeur des études qui note ce qu'on lui a dit de vive voix. Depuis la
   * pose d'un créneau, on ne veut pas d'un éditeur de plus dans la fenêtre :
   * juste le chemin le plus court vers l'endroit qui existe déjà.
   */
  editHref?: string
}

function etatDe(week: TeacherWeek, jour: DayOfWeek, heure: number): EtatCase {
  const debut = heure * 60
  const fin = debut + 60
  const couvre = (d: string, f: string) => {
    const d1 = enMinutes(d)
    const f1 = enMinutes(f)
    return d1 !== null && f1 !== null && d1 < fin && f1 > debut
  }

  if (week.busy.some((b) => b.day === jour && b.kind === "course" && couvre(b.start_time, b.end_time)))
    return "cours"
  if (
    week.busy.some((b) => b.day === jour && b.kind === "unavailable" && couvre(b.start_time, b.end_time))
  )
    return "ferme"
  if (week.open.some((o) => o.day === jour && couvre(o.start_time, o.end_time))) return "ouvert"
  return week.has_declarations ? "hors" : "libre"
}

function estVise(
  jour: DayOfWeek,
  heure: number,
  jourVise: DayOfWeek | undefined,
  debut: string | undefined,
  fin: string | undefined,
): boolean {
  if (jour !== jourVise) return false
  const d = enMinutes(debut)
  const f = enMinutes(fin)
  if (d === null || f === null || d >= f) return false
  return d < (heure + 1) * 60 && f > heure * 60
}

export function TeacherWeekPanel({
  week,
  isLoading,
  highlightDay,
  highlightStart,
  highlightEnd,
  title,
  editHref,
}: TeacherWeekPanelProps) {
  if (isLoading) {
    return (
      <div className="space-y-2" aria-busy="true">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    )
  }

  if (!week) return null

  const jourVise = versJourAnglais(highlightDay)
  const parJour = JOURS.map((jour) => ({
    jour,
    empechements: [
      ...week.busy.filter((b) => b.day === jour),
    ].sort((a, b) => a.start_time.localeCompare(b.start_time)),
    ouvertures: week.open
      .filter((o) => o.day === jour)
      .sort((a, b) => a.start_time.localeCompare(b.start_time)),
  }))

  const rienDeclare = !week.has_declarations
  const semaineVide = week.busy.length === 0

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{title ?? `Semaine de ${week.teacher_name}`}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Legende />
          {editHref && (
            <Link
              href={editHref as Route}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-1.5 text-xs font-medium text-primary underline-offset-4 hover:underline sm:h-auto"
            >
              <SquarePen className="h-3.5 w-3.5" aria-hidden />
              Modifier ses disponibilités
            </Link>
          )}
        </div>
      </div>

      {rienDeclare && (
        <p className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            Aucune plage déclarée : l&apos;enseignant est considéré disponible à toute heure.
            {semaineVide ? "" : " Seuls ses cours déjà posés bloquent."}
          </span>
        </p>
      )}

      {/* Écran large : la grille jour x heure, balayable d'un regard. */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full border-separate border-spacing-0.5 text-[10px]">
          <caption className="sr-only">
            Occupation de la semaine, par jour et par heure
          </caption>
          <thead>
            <tr>
              <th scope="col" className="w-9 text-left font-medium text-muted-foreground">
                <span className="sr-only">Heure</span>
              </th>
              {JOURS.map((jour) => (
                <th
                  key={jour}
                  scope="col"
                  className="pb-1 text-center text-[11px] font-medium text-muted-foreground"
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
                  className="pr-1 text-right align-middle font-normal tabular-nums text-muted-foreground"
                >
                  {String(heure).padStart(2, "0")}h
                </th>
                {JOURS.map((jour) => {
                  const etat = etatDe(week, jour, heure)
                  const vise = estVise(jour, heure, jourVise, highlightStart, highlightEnd)
                  return (
                    <td key={jour} className="p-0">
                      <div
                        className={`h-5 rounded-sm ${STYLES[etat]} ${
                          vise ? "outline outline-2 outline-offset-1 outline-foreground/70" : ""
                        }`}
                        title={`${JOURS_FR[jour]} ${String(heure).padStart(2, "0")}h — ${LIBELLES[etat]}`}
                      >
                        <span className="sr-only">
                          {JOURS_FR[jour]} {heure}h : {LIBELLES[etat]}
                          {vise ? ", créneau en cours de saisie" : ""}
                        </span>
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Téléphone : la même chose en liste, lisible sans zoom. */}
      <ul className="space-y-1.5 sm:hidden">
        {parJour.map(({ jour, empechements, ouvertures }) => (
          <li
            key={jour}
            className={`rounded-lg px-3 py-2 ${
              jour === jourVise ? "bg-muted ring-1 ring-foreground/20" : "bg-muted/40"
            }`}
          >
            <p className="text-xs font-medium capitalize">{JOURS_FR[jour]}</p>
            {empechements.length === 0 && ouvertures.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {week.has_declarations ? "Aucune plage ouverte" : "Rien de prévu"}
              </p>
            ) : (
              <ul className="mt-1 space-y-1">
                {empechements.map((b) => (
                  <li
                    key={`${b.kind}-${b.start_time}`}
                    className="flex items-start gap-1.5 text-xs text-muted-foreground"
                  >
                    {b.kind === "course" ? (
                      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-sky-600" aria-hidden />
                    ) : (
                      <CalendarX2 className="mt-0.5 h-3 w-3 shrink-0 text-rose-600" aria-hidden />
                    )}
                    <span className="tabular-nums">
                      {b.start_time}–{b.end_time}
                    </span>
                    <span>
                      {b.label}
                      {b.class_name ? ` · ${b.class_name}` : ""}
                    </span>
                  </li>
                ))}
                {ouvertures.map((o) => (
                  <li
                    key={`open-${o.start_time}`}
                    className="flex items-start gap-1.5 text-xs text-muted-foreground"
                  >
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" aria-hidden />
                    <span className="tabular-nums">
                      {o.start_time}–{o.end_time}
                    </span>
                    <span>{o.preferred ? "Préféré" : "Disponible"}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Legende() {
  const entrees: { etat: EtatCase; texte: string }[] = [
    { etat: "cours", texte: "Cours" },
    { etat: "ferme", texte: "Indisponible" },
    { etat: "ouvert", texte: "Disponible" },
  ]
  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
      {entrees.map(({ etat, texte }) => (
        <li key={etat} className="flex items-center gap-1">
          <span className={`h-2.5 w-2.5 rounded-sm ${STYLES[etat]}`} aria-hidden />
          {texte}
        </li>
      ))}
    </ul>
  )
}
