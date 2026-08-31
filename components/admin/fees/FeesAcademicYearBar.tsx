"use client"

import { CalendarRange, TriangleAlert } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { AcademicYear } from "@/lib/contracts/academic-year"

/**
 * Repère d'année, posé à côté des titres de section.
 *
 * L'écran des frais se lit en scrollant : sur un téléphone, la barre de choix
 * de l'année est déjà hors champ quand on ajoute un montant ou une option.
 * Le repère répète l'année là où l'on agit, et vire à l'ambre dès qu'elle
 * n'est pas l'année en cours. L'icône double l'information portée par la
 * couleur, pour un écran lu en plein soleil.
 */
export function FeesAcademicYearChip({
  year,
  className,
}: {
  year: AcademicYear | undefined
  className?: string
}) {
  if (!year) return null

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        year.is_current
          ? "border-border bg-muted text-muted-foreground"
          : "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
        className,
      )}
    >
      {year.is_current ? (
        <CalendarRange className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      ) : (
        <TriangleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      )}
      {year.is_current ? `Année ${year.name}` : `Année ${year.name} · pas l'année en cours`}
    </span>
  )
}

/**
 * Rappel de l'année à l'intérieur d'un modal.
 *
 * Un modal cache l'écran qui l'a ouvert : sans ce rappel, rien n'y dit sur
 * quelle année l'enregistrement va tomber, et c'est là que la confusion s'est
 * jouée en production.
 */
export function FeesAcademicYearNotice({
  year,
  action,
}: {
  year: AcademicYear | undefined
  /** Début de phrase, complété par « l'année ... ». */
  action: string
}) {
  if (!year) return null

  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-2 text-xs leading-snug",
        year.is_current
          ? "border-border bg-muted/50 text-muted-foreground"
          : "border-amber-500/40 bg-amber-500/10 font-medium text-amber-700 dark:text-amber-300",
      )}
    >
      {year.is_current ? (
        <CalendarRange className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
      ) : (
        <TriangleAlert className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      <span>
        {action} l&apos;année <span className="font-semibold">{year.name}</span>
        {year.is_current ? "." : ", qui n'est pas l'année en cours."}
      </span>
    </p>
  )
}

interface FeesAcademicYearBarProps {
  years: AcademicYear[] | undefined
  /** Année réellement affichée par l'écran, choix de l'utilisateur inclus. */
  selectedYearId: number | undefined
  onSelect: (yearId: number) => void
  isLoading?: boolean
}

/**
 * Choix de l'année sur laquelle porte tout l'écran des frais.
 *
 * L'écran s'ouvrait sur la première année renvoyée par l'API, sans rien
 * afficher de ce choix. Une école y a saisi sa grille sur l'année précédente
 * sans le voir : les montants n'apparaissaient plus nulle part ailleurs, et
 * la grille de l'année en cours semblait avoir disparu.
 */
export function FeesAcademicYearBar({
  years,
  selectedYearId,
  onSelect,
  isLoading,
}: FeesAcademicYearBarProps) {
  const items = years ?? []
  const selected = items.find((y) => y.id === selectedYearId)
  const currentYear = items.find((y) => y.is_current)
  const horsAnneeEnCours = !!selected && !selected.is_current

  return (
    <Card className="rounded-xl border shadow-sm">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="w-full min-w-0 space-y-1.5 sm:w-72">
          <Label htmlFor="fees-academic-year">Année scolaire</Label>
          {isLoading && items.length === 0 ? (
            <Skeleton className="h-11 w-full rounded-md" />
          ) : (
            <Select
              value={selectedYearId ? String(selectedYearId) : undefined}
              onValueChange={(value) => onSelect(Number(value))}
              disabled={items.length === 0}
            >
              <SelectTrigger id="fees-academic-year" className="h-11 w-full">
                <SelectValue placeholder="Aucune année scolaire" />
              </SelectTrigger>
              <SelectContent>
                {items.map((year) => (
                  <SelectItem key={year.id} value={String(year.id)} className="h-11">
                    {year.name}
                    {year.is_current ? " (en cours)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {horsAnneeEnCours ? (
          <p
            role="status"
            className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-medium leading-snug text-amber-700 dark:text-amber-300 sm:max-w-sm"
          >
            <TriangleAlert className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Ce n&apos;est pas l&apos;année en cours
              {currentYear ? ` (${currentYear.name})` : ""}. Ce qui est saisi ici ne
              s&apos;appliquera pas aux inscriptions du moment.
            </span>
          </p>
        ) : (
          <p className="text-xs leading-snug text-muted-foreground sm:max-w-sm sm:text-right">
            Montants par niveau et frais optionnels affichés ci-dessous portent sur cette
            année.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
