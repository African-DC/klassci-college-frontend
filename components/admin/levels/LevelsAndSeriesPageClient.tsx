"use client"

import { useState, useEffect } from "react"
import {
  Layers,
  ChevronRight,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  GraduationCap,
  BookOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DataError } from "@/components/shared/DataError"
import { useLevels, useDeleteLevel } from "@/lib/hooks/useLevels"
import { useSeriesList, useDeleteSeries } from "@/lib/hooks/useSeries"
import { LevelCreateModal } from "./LevelCreateModal"
import { LevelEditModal } from "./LevelEditModal"
import { SeriesCreateModal } from "../series/SeriesCreateModal"
import { SeriesEditModal } from "../series/SeriesEditModal"
import type { Level } from "@/lib/contracts/level"
import type { Series } from "@/lib/contracts/series"

export function LevelsAndSeriesPageClient() {
  const { data: levelsData, isLoading: levelsLoading, isError: levelsError, error: levelsErr, refetch: refetchLevels } = useLevels()
  const { data: seriesData, isLoading: seriesLoading } = useSeriesList()
  const { mutate: deleteLevel } = useDeleteLevel()
  const { mutate: deleteSeries } = useDeleteSeries()

  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [initialized, setInitialized] = useState(false)
  const [levelCreateOpen, setLevelCreateOpen] = useState(false)
  const [editLevelId, setEditLevelId] = useState<number | null>(null)
  const [seriesCreateForLevel, setSeriesCreateForLevel] = useState<number | null>(null)
  const [editSeriesId, setEditSeriesId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: "level" | "series"; id: number; name: string } | null>(null)

  // Expand all on first load
  useEffect(() => {
    if (!initialized && levelsData?.items?.length) {
      setExpanded(new Set(levelsData.items.map((l: Level) => l.id)))
      setInitialized(true)
    }
  }, [levelsData, initialized])

  const levels: Level[] = levelsData?.items ?? []
  const allSeries: Series[] = seriesData?.items ?? []

  const seriesByLevel = new Map<number, Series[]>()
  for (const s of allSeries) {
    const list = seriesByLevel.get(s.level_id) ?? []
    list.push(s)
    seriesByLevel.set(s.level_id, list)
  }

  const sortedLevels = [...levels].sort((a, b) => a.order - b.order)

  const toggleExpand = (levelId: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(levelId)) next.delete(levelId)
      else next.add(levelId)
      return next
    })
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    if (deleteTarget.type === "level") deleteLevel(deleteTarget.id)
    else deleteSeries(deleteTarget.id)
    setDeleteTarget(null)
  }

  if (levelsLoading || seriesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-60" />
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="rounded-lg border bg-card p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-72" />
          ))}
        </div>
      </div>
    )
  }

  if (levelsError) {
    return <DataError message="Impossible de charger les niveaux." error={levelsErr} onRetry={refetchLevels} />
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-xl tracking-tight">Niveaux & Séries</h1>
            <p className="text-sm text-muted-foreground">Structure académique de l&apos;établissement</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => setExpanded(new Set(levels.map((l) => l.id)))}
          >
            Tout déplier
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => setExpanded(new Set())}
          >
            Tout replier
          </Button>
          <Button size="sm" onClick={() => setLevelCreateOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Nouveau niveau
          </Button>
        </div>
      </div>

      {/* Tree */}
      {sortedLevels.length === 0 ? (
        <div className="rounded-lg border bg-card flex flex-col items-center justify-center py-16 text-center">
          <Layers className="h-8 w-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Aucun niveau configuré.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setLevelCreateOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Créer le premier niveau
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden select-none p-3 space-y-1">
          {sortedLevels.map((level) => {
            const isOpen = expanded.has(level.id)
            const levelSeries = seriesByLevel.get(level.id) ?? []

            return (
              <div key={level.id}>
                {/* Level row */}
                <div className="flex items-center gap-1.5 rounded-md px-2 py-2 hover:bg-muted/60 transition-colors">
                  {/* Chevron */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(level.id)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded hover:bg-muted transition-colors"
                  >
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  {/* Icon */}
                  <GraduationCap className={`h-6 w-6 shrink-0 ${isOpen ? "text-primary" : "text-primary/60"}`} />

                  {/* Name */}
                  <span
                    className="text-base font-semibold cursor-pointer"
                    onClick={() => toggleExpand(level.id)}
                  >
                    {level.name}
                  </span>

                  {/* Series count badge */}
                  {levelSeries.length > 0 && (
                    <span className="text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-0.5">
                      {levelSeries.length}
                    </span>
                  )}

                  {/* Actions — right after name */}
                  <button
                    type="button"
                    className="p-1.5 rounded hover:bg-primary/10 transition-colors"
                    onClick={() => setSeriesCreateForLevel(level.id)}
                    title="Ajouter une série"
                  >
                    <Plus className="h-4 w-4 text-primary/60 hover:text-primary" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 rounded hover:bg-muted transition-colors"
                    onClick={() => setEditLevelId(level.id)}
                    title="Modifier le niveau"
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 rounded hover:bg-destructive/10 transition-colors"
                    onClick={() => setDeleteTarget({ type: "level", id: level.id, name: level.name })}
                    title="Supprimer le niveau"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground/60 hover:text-destructive" />
                  </button>
                </div>

                {/* Series children */}
                {isOpen && (
                  <div className="ml-5 pl-4 border-l-2 border-border/60 space-y-0.5 mt-0.5 mb-2">
                    {levelSeries.map((series) => (
                      <div
                        key={series.id}
                        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-muted/40 transition-colors"
                      >
                        <BookOpen className="h-5 w-5 shrink-0 text-muted-foreground/60" />

                        <span className="text-sm font-medium text-foreground/80">
                          Série {series.name}
                        </span>

                        {/* Actions — right after name */}
                        <button
                          type="button"
                          className="p-1.5 rounded hover:bg-muted transition-colors"
                          onClick={() => setEditSeriesId(series.id)}
                          title="Modifier la série"
                        >
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 rounded hover:bg-destructive/10 transition-colors"
                          onClick={() => setDeleteTarget({ type: "series", id: series.id, name: `Série ${series.name}` })}
                          title="Supprimer la série"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-destructive" />
                        </button>
                      </div>
                    ))}

                    {/* Add series inline */}
                    <button
                      type="button"
                      className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] text-muted-foreground/50 hover:text-primary hover:bg-primary/5 transition-colors"
                      onClick={() => setSeriesCreateForLevel(level.id)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Ajouter une série
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      <LevelCreateModal open={levelCreateOpen} onClose={() => setLevelCreateOpen(false)} />
      <LevelEditModal levelId={editLevelId} open={!!editLevelId} onClose={() => setEditLevelId(null)} />
      <SeriesCreateModal
        open={!!seriesCreateForLevel}
        onClose={() => setSeriesCreateForLevel(null)}
        defaultLevelId={seriesCreateForLevel ?? undefined}
      />
      <SeriesEditModal seriesId={editSeriesId} open={!!editSeriesId} onClose={() => setEditSeriesId(null)} />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {deleteTarget?.name} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible.
              {deleteTarget?.type === "level" && " Toutes les séries et classes associées seront impactées."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
