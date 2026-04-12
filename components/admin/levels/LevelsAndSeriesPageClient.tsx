"use client"

import { useState } from "react"
import {
  Layers,
  ChevronRight,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  FolderOpen,
  Folder,
  FileText,
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

  const [expanded, setExpanded] = useState<Set<number>>(() => new Set())
  const [levelCreateOpen, setLevelCreateOpen] = useState(false)
  const [editLevelId, setEditLevelId] = useState<number | null>(null)
  const [seriesCreateForLevel, setSeriesCreateForLevel] = useState<number | null>(null)
  const [editSeriesId, setEditSeriesId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: "level" | "series"; id: number; name: string } | null>(null)

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

  const expandAll = () => setExpanded(new Set(levels.map((l) => l.id)))
  const collapseAll = () => setExpanded(new Set())

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
        <div className="rounded-lg border bg-card">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-2.5 border-b last:border-0">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (levelsError) {
    return <DataError message="Impossible de charger les niveaux." error={levelsErr} onRetry={refetchLevels} />
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-xl tracking-tight">Niveaux & Séries</h1>
            <p className="text-sm text-muted-foreground">Structure académique</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-xs" onClick={expandAll}>
            Tout déplier
          </Button>
          <Button variant="ghost" size="sm" className="text-xs" onClick={collapseAll}>
            Tout replier
          </Button>
          <Button size="sm" onClick={() => setLevelCreateOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Nouveau niveau
          </Button>
        </div>
      </div>

      {/* Tree explorer */}
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
        <div className="rounded-lg border bg-card overflow-hidden select-none">
          {/* Tree header */}
          <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/40">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Explorateur
            </p>
            <p className="text-[10px] text-muted-foreground">
              {levels.length} niveau{levels.length > 1 ? "x" : ""} · {allSeries.length} série{allSeries.length > 1 ? "s" : ""}
            </p>
          </div>

          {/* Tree body */}
          <div className="text-sm">
            {sortedLevels.map((level, levelIdx) => {
              const isOpen = expanded.has(level.id)
              const levelSeries = seriesByLevel.get(level.id) ?? []
              const isLast = levelIdx === sortedLevels.length - 1

              return (
                <div key={level.id}>
                  {/* Level row */}
                  <div
                    className="group flex items-center gap-0 pr-2 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleExpand(level.id)}
                  >
                    {/* Indent guide + chevron */}
                    <div className="flex items-center justify-center w-8 shrink-0">
                      {isOpen ? (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>

                    {/* Folder icon */}
                    <div className="flex items-center justify-center w-6 shrink-0">
                      {isOpen ? (
                        <FolderOpen className="h-4 w-4 text-primary" />
                      ) : (
                        <Folder className="h-4 w-4 text-primary/70" />
                      )}
                    </div>

                    {/* Name */}
                    <span className="flex-1 py-[7px] pl-1.5 font-medium text-[13px] truncate">
                      {level.name}
                    </span>

                    {/* Series count */}
                    {levelSeries.length > 0 && (
                      <span className="text-[10px] text-muted-foreground/60 mr-1 tabular-nums">
                        {levelSeries.length}
                      </span>
                    )}

                    {/* Actions — visible on hover */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-muted"
                        onClick={(e) => { e.stopPropagation(); setSeriesCreateForLevel(level.id) }}
                        title="Ajouter une série"
                      >
                        <Plus className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                      </button>
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-muted"
                        onClick={(e) => { e.stopPropagation(); setEditLevelId(level.id) }}
                        title="Modifier"
                      >
                        <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </button>
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-destructive/10"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: "level", id: level.id, name: level.name }) }}
                        title="Supprimer"
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  </div>

                  {/* Series children */}
                  {isOpen && (
                    <div>
                      {levelSeries.length === 0 ? (
                        <div className="flex items-center gap-0 pr-2 hover:bg-muted/30 transition-colors">
                          {/* Indent: tree line */}
                          <div className="relative w-8 shrink-0">
                            {!isLast && <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border" />}
                            <div className="absolute left-[15px] top-1/2 w-3 h-px bg-border" />
                          </div>
                          <div className="flex items-center justify-center w-6 shrink-0" />
                          <button
                            type="button"
                            className="py-[6px] pl-1.5 text-[12px] text-muted-foreground/50 italic hover:text-primary transition-colors"
                            onClick={() => setSeriesCreateForLevel(level.id)}
                          >
                            + Ajouter une série...
                          </button>
                        </div>
                      ) : (
                        levelSeries.map((series, seriesIdx) => {
                          const isLastSeries = seriesIdx === levelSeries.length - 1

                          return (
                            <div
                              key={series.id}
                              className="group/series flex items-center gap-0 pr-2 hover:bg-muted/30 transition-colors"
                            >
                              {/* Indent: tree connector lines */}
                              <div className="relative w-8 shrink-0 self-stretch">
                                {/* Vertical line from parent */}
                                {(!isLast || !isLastSeries) && (
                                  <div
                                    className="absolute left-[15px] top-0 w-px bg-border"
                                    style={{ bottom: isLastSeries ? "50%" : 0 }}
                                  />
                                )}
                                {isLast && !isLastSeries && (
                                  <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border" />
                                )}
                                {isLast && isLastSeries && (
                                  <div className="absolute left-[15px] top-0 w-px bg-border" style={{ height: "50%" }} />
                                )}
                                {/* Horizontal branch */}
                                <div className="absolute left-[15px] top-1/2 w-3 h-px bg-border" />
                              </div>

                              {/* File icon */}
                              <div className="flex items-center justify-center w-6 shrink-0">
                                <FileText className="h-3.5 w-3.5 text-muted-foreground/60" />
                              </div>

                              {/* Name */}
                              <span className="flex-1 py-[6px] pl-1.5 text-[13px] truncate text-muted-foreground">
                                Série {series.name}
                              </span>

                              {/* Actions on hover */}
                              <div className="flex items-center gap-0.5 opacity-0 group-hover/series:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  className="p-1 rounded hover:bg-muted"
                                  onClick={() => setEditSeriesId(series.id)}
                                  title="Modifier"
                                >
                                  <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                </button>
                                <button
                                  type="button"
                                  className="p-1 rounded hover:bg-destructive/10"
                                  onClick={() => setDeleteTarget({ type: "series", id: series.id, name: `Série ${series.name}` })}
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                </button>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
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
