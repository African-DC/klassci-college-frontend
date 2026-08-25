"use client"

/**
 * La même semaine, en liste, pour les écrans étroits.
 *
 * Une grille de six colonnes sur un téléphone donne des cases de six
 * millimètres : illisibles, et impossibles à viser du pouce. On liste donc
 * jour par jour ce qui empêche, avec l'heure devant — c'est ainsi qu'on lit un
 * emploi du temps qu'on ne peut pas embrasser du regard.
 */

import { CalendarX2, Check, GraduationCap } from "lucide-react"
import type { DayOfWeek, TeacherWeek } from "@/lib/contracts/timetable"
import { JOURS_FR } from "@/lib/timetable/semaine"
import { JOURS } from "@/lib/timetable/semaine"

interface Props {
  week: TeacherWeek
  jourVise?: DayOfWeek
}

export function SemaineListe({ week, jourVise }: Props) {
  const parJour = JOURS.map((jour) => ({
    jour,
    empechements: week.busy
      .filter((b) => b.day === jour)
      .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    ouvertures: week.open
      .filter((o) => o.day === jour)
      .sort((a, b) => a.start_time.localeCompare(b.start_time)),
  }))

  return (
    <ul className="space-y-1.5">
      {parJour.map(({ jour, empechements, ouvertures }) => (
        <li
          key={jour}
          className={`rounded-lg px-3 py-2 ${
            jour === jourVise ? "bg-orange-500/10 ring-1 ring-orange-500/40" : "bg-muted/40"
          }`}
        >
          <p className="text-xs font-semibold capitalize">{JOURS_FR[jour]}</p>
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
                    <GraduationCap className="mt-0.5 h-3 w-3 shrink-0 text-sky-600" aria-hidden />
                  ) : (
                    <CalendarX2 className="mt-0.5 h-3 w-3 shrink-0 text-rose-600" aria-hidden />
                  )}
                  <span className="shrink-0 whitespace-nowrap tabular-nums">
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
                  <span className="shrink-0 whitespace-nowrap tabular-nums">
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
  )
}
