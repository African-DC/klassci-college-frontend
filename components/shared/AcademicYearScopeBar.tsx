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
 * Sur un téléphone, la barre de choix de l'année est déjà hors champ quand
 * on agit plus bas. Le repère la répète là où l'on travaille, et vire à
 * l'ambre dès qu'elle n'est pas l'année en cours.
 */
export function AcademicYearChip({
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
 * quelle année l'enregistrement va tomber.
 */
export function AcademicYearNotice({
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

interface AcademicYearScopeBarProps {
  years: AcademicYear[] | undefined
  selectedYearId: number | undefined
  onSelect: (yearId: number) => void
  isLoading?: boolean
  selectId: string
  currentHelper: string
  offYearWarning: string
}

/**
 * Choix de l'année sur laquelle porte tout un écran.
 *
 * Sans ce sélecteur visible, une école travaille sur l'année précédente
 * sans le voir : les totaux gonflent, ou la grille semble avoir disparu.
 */
export function AcademicYearScopeBar({
  years,
  selectedYearId,
  onSelect,
  isLoading,
  selectId,
  currentHelper,
  offYearWarning,
}: AcademicYearScopeBarProps) {
  const items = years ?? []
  const selected = items.find((y) => y.id === selectedYearId)
  const horsAnneeEnCours = !!selected && !selected.is_current

  return (
    <Card className="rounded-xl border shadow-sm">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="w-full min-w-0 space-y-1.5 sm:w-72">
          <Label htmlFor={selectId}>Année scolaire</Label>
          {isLoading && items.length === 0 ? (
            <Skeleton className="h-11 w-full rounded-md" />
          ) : (
            <Select
              value={selectedYearId ? String(selectedYearId) : undefined}
              onValueChange={(value) => onSelect(Number(value))}
              disabled={items.length === 0}
            >
              <SelectTrigger id={selectId} className="h-11 w-full">
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
            <span>{offYearWarning}</span>
          </p>
        ) : (
          <p className="text-xs leading-snug text-muted-foreground sm:max-w-sm sm:text-right">
            {currentHelper}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
