"use client"

import { useState } from "react"
import {
  Layers,
  ChevronRight,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  GitBranch,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  const [levelCreateOpen, setLevelCreateOpen] = useState(false)
  const [editLevelId, setEditLevelId] = useState<number | null>(null)
  const [seriesCreateForLevel, setSeriesCreateForLevel] = useState<number | null>(null)
  const [editSeriesId, setEditSeriesId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: "level" | "series"; id: number; name: string } | null>(null)

  const levels: Level[] = levelsData?.items ?? []
  const allSeries: Series[] = seriesData?.items ?? []

  // Group series by level_id
  const seriesByLevel = new Map<number, Series[]>()
  for (const s of allSeries) {
    const list = seriesByLevel.get(s.level_id) ?? []
    list.push(s)
    seriesByLevel.set(s.level_id, list)
  }

  // Sort levels by order
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
    if (deleteTarget.type === "level") {
      deleteLevel(deleteTarget.id)
    } else {
      deleteSeries(deleteTarget.id)
    }
    setDeleteTarget(null)
  }

  if (levelsLoading || seriesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64 mt-1" />
            </div>
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    )
  }

  if (levelsError) {
    return <DataError message="Impossible de charger les niveaux." error={levelsErr} onRetry={refetchLevels} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-xl tracking-tight">Niveaux & Séries</h1>
            <p className="text-sm text-muted-foreground">Structure académique de l&apos;établissement</p>
          </div>
        </div>
        <Button onClick={() => setLevelCreateOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Nouveau niveau
        </Button>
      </div>

      {/* Tree */}
      {sortedLevels.length === 0 ? (
        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted mb-3">
              <Layers className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Aucun niveau configuré.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sortedLevels.map((level) => {
            const isOpen = expanded.has(level.id)
            const levelSeries = seriesByLevel.get(level.id) ?? []
            const hasSerries = levelSeries.length > 0

            return (
              <div key={level.id}>
                {/* Level row */}
                <Card className={`border-0 shadow-sm ring-1 transition-all ${isOpen ? "ring-primary/30 shadow-md" : "ring-border"}`}>
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3 px-4 py-3">
                      {/* Expand toggle */}
                      <button
                        type="button"
                        onClick={() => toggleExpand(level.id)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-muted transition-colors"
                      >
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>

                      {/* Level info */}
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Layers className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{level.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Ordre : {level.order}
                          {hasSerries && ` · ${levelSeries.length} série${levelSeries.length > 1 ? "s" : ""}`}
                        </p>
                      </div>

                      {/* Badges */}
                      {hasSerries && (
                        <Badge variant="secondary" className="text-[10px]">
                          {levelSeries.length} série{levelSeries.length > 1 ? "s" : ""}
                        </Badge>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => { e.stopPropagation(); setSeriesCreateForLevel(level.id) }}
                          title="Ajouter une série"
                        >
                          <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => { e.stopPropagation(); setEditLevelId(level.id) }}
                          title="Modifier"
                        >
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: "level", id: level.id, name: level.name }) }}
                          title="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Series children */}
                    {isOpen && (
                      <div className="border-t bg-muted/30 px-4 py-2">
                        {levelSeries.length === 0 ? (
                          <div className="flex items-center justify-between py-3 px-2">
                            <p className="text-xs text-muted-foreground italic">Aucune série pour ce niveau</p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => setSeriesCreateForLevel(level.id)}
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              Ajouter
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {levelSeries.map((series) => (
                              <div
                                key={series.id}
                                className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-background/60 transition-colors"
                              >
                                {/* Tree connector */}
                                <div className="flex items-center gap-2 text-muted-foreground/40">
                                  <div className="h-px w-4 bg-border" />
                                  <GitBranch className="h-3.5 w-3.5 text-muted-foreground/60" />
                                </div>

                                <p className="text-sm font-medium flex-1">Série {series.name}</p>

                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => setEditSeriesId(series.id)}
                                    title="Modifier"
                                  >
                                    <Pencil className="h-3 w-3 text-muted-foreground" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-destructive hover:text-destructive"
                                    onClick={() => setDeleteTarget({ type: "series", id: series.id, name: `Série ${series.name}` })}
                                    title="Supprimer"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            {/* Add series button */}
                            <div className="flex items-center gap-3 px-3 py-1">
                              <div className="flex items-center gap-2 text-muted-foreground/40">
                                <div className="h-px w-4 bg-border" />
                                <Plus className="h-3.5 w-3.5 text-muted-foreground/40" />
                              </div>
                              <button
                                type="button"
                                className="text-xs text-primary hover:underline"
                                onClick={() => setSeriesCreateForLevel(level.id)}
                              >
                                Ajouter une série
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
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
              {deleteTarget?.type === "level" && " Toutes les séries associées seront aussi impactées."}
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
