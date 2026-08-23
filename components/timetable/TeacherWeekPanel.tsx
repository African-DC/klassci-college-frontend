"use client"

/**
 * La semaine d'un enseignant, montrée pendant qu'on lui pose un créneau.
 *
 * Deux tailles d'écran, deux lectures du même contenu, parce qu'aucune ne
 * marche partout : sur un écran large, une grille jour × heure se balaie d'un
 * regard et se trace au doigt ; sur un téléphone, elle se réduit à des cases
 * illisibles, alors on liste les empêchements jour par jour. Le composant ne
 * choisit pas à la place du navigateur, il rend les deux et laisse les points
 * de rupture décider.
 *
 * Il ne traduit rien : la plage visée arrive en « HH:MM » et repart telle
 * quelle vers la grille.
 *
 * Aucun bouton « Actualiser » : la requête se relit d'elle-même au retour sur
 * l'onglet, ce qui est exactement le cas qu'un tel bouton servirait. En avoir
 * deux faisait tourner l'icône pendant la relecture automatique, sans que
 * personne ait cliqué.
 */

import Link from "next/link"
import type { Route } from "next"
import { Info, SquarePen } from "lucide-react"
import type { DayOfWeek, TeacherWeek } from "@/lib/contracts/timetable"
import { versJourAnglais } from "@/lib/timetable/week-overlap"
import { Skeleton } from "@/components/ui/skeleton"
import { Legende } from "./week-grid/Legende"
import { SemaineGrille } from "./week-grid/SemaineGrille"
import { SemaineListe } from "./week-grid/SemaineListe"
import type { EtatCase } from "./week-grid/etats"
import type { PlageChoisie } from "./week-grid/use-selection-glissee"

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
   * Lien vers la fiche de l'enseignant pour y corriger ses plages.
   *
   * L'administration a le droit de les saisir à sa place — chez ROSTAN c'est
   * le directeur des études qui note ce qu'on lui a dit de vive voix.
   */
  editHref?: string
  /** Rendu du panneau interactif : tracer une plage la renvoie au formulaire. */
  onChoisir?: (plage: PlageChoisie) => void
}

/** Les états réellement présents — la légende ne nomme rien d'autre. */
function etatsPresents(week: TeacherWeek): Set<EtatCase> {
  const vus = new Set<EtatCase>()
  if (week.busy.some((b) => b.kind === "course")) vus.add("cours")
  if (week.busy.some((b) => b.kind === "unavailable")) vus.add("ferme")
  if (week.open.length > 0) vus.add("ouvert")
  vus.add(week.has_declarations ? "hors" : "libre")
  return vus
}

export function TeacherWeekPanel({
  week,
  isLoading,
  highlightDay,
  highlightStart,
  highlightEnd,
  title,
  editHref,
  onChoisir,
}: TeacherWeekPanelProps) {
  if (isLoading) {
    return (
      <div className="space-y-2" aria-busy="true">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!week) return null

  const jourVise = versJourAnglais(highlightDay)
  const vise: PlageChoisie | null =
    jourVise && highlightStart && highlightEnd
      ? { jour: jourVise, debut: highlightStart, fin: highlightEnd }
      : null

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">{title ?? `Semaine de ${week.teacher_name}`}</p>
        <div className="flex items-center gap-1">
          {editHref && (
            <Link
              href={editHref as Route}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10 sm:h-8"
            >
              <SquarePen className="h-3.5 w-3.5" aria-hidden />
              Modifier ses disponibilités
            </Link>
          )}
        </div>
      </div>

      <Legende etats={etatsPresents(week)} />

      {!week.has_declarations && (
        <p className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          Aucune plage déclarée : l&apos;enseignant est considéré disponible à toute heure. Seuls
          ses cours déjà posés bloquent.
        </p>
      )}

      <div className="hidden sm:block">
        <SemaineGrille week={week} vise={vise} onChoisir={onChoisir} />
      </div>

      <div className="sm:hidden">
        <SemaineListe week={week} jourVise={jourVise as DayOfWeek | undefined} />
      </div>
    </div>
  )
}
