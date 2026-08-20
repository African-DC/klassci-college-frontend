"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"

import { useSubjects, useDeleteSubject } from "@/lib/hooks/useSubjects"
import { useLevels } from "@/lib/hooks/useLevels"
import { useSeriesList } from "@/lib/hooks/useSeries"
import { useKanbanAutoScroll } from "@/lib/hooks/useKanbanAutoScroll"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SubjectEditModal } from "./SubjectEditModal"
import { SubjectAssignModal, type AssignTarget } from "./SubjectAssignModal"
import { SubjectCatalogueColumn } from "./SubjectCatalogueColumn"
import { SubjectLevelColumn } from "./SubjectLevelColumn"
import { firstFreeSeriesSlot, isSeriesSlotTaken } from "@/lib/utils/subject-assignment"
import { cn } from "@/lib/utils"

export function SubjectsKanbanView() {
  const { data: subjectsData, isLoading: subjectsLoading } = useSubjects({ size: 100 })
  const { data: levelsData, isLoading: levelsLoading } = useLevels({ size: 100 })
  const { data: seriesData } = useSeriesList({ size: 100 })
  const deleteMutation = useDeleteSubject()
  const scroll = useKanbanAutoScroll()

  const [editId, setEditId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)
  const [assignTarget, setAssignTarget] = useState<AssignTarget | null>(null)
  const [search, setSearch] = useState("")
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null)
  const debouncedSearch = useDebounce(search)

  const isLoading = subjectsLoading || levelsLoading
  const subjects = subjectsData?.items ?? []
  const levels = levelsData?.items?.slice().sort((a, b) => a.order - b.order) ?? []
  const allSeries = seriesData?.items ?? []

  const filteredSubjects = useMemo(() => {
    if (!debouncedSearch) return subjects
    const q = debouncedSearch.toLowerCase()
    return subjects.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      s.level_name?.toLowerCase().includes(q),
    )
  }, [subjects, debouncedSearch])

  const catalogue = useMemo(
    () => filteredSubjects.filter((s) => s.level_id === null),
    [filteredSubjects],
  )

  function handleDrop(subjectId: number, levelId: number, levelName: string, seriesId: number | null) {
    const source = subjects.find((s) => s.id === subjectId)
    if (!source) return
    const levelSeries = allSeries.filter((item) => item.level_id === levelId)
    const levelInstances = subjects.filter((item) => item.level_id === levelId && item.name === source.name)
    const free = firstFreeSeriesSlot(levelInstances, levelSeries)
    scroll.stop()
    setAssignTarget({
      subjectId,
      subjectName: source.name,
      levelId,
      levelName,
      seriesId: seriesId != null && !isSeriesSlotTaken(levelInstances, seriesId)
        ? seriesId
        : (free === undefined ? null : free),
      defaultCoef: source.coefficient,
      defaultHours: source.hours_per_week,
    })
  }

  const totalSubjects = subjects.length
  const totalHours = subjects.reduce((sum, s) => sum + s.hours_per_week, 0)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-4 overflow-x-auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-72 shrink-0 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{totalSubjects} matières</span>
          <span className="text-border">|</span>
          <span>{totalHours}h / semaine au total</span>
          <span className="text-border">|</span>
          <span className="text-xs italic">Glisser du catalogue vers un niveau pour assigner</span>
        </div>
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher une matière..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-sm"
          />
        </div>
      </div>

      <div
        ref={scroll.boardRef}
        className="-mx-2 flex gap-4 overflow-x-auto px-2 pb-4"
      >
        <div
          ref={scroll.catalogueRef}
          className={cn(scroll.isDragging && "sticky left-0 z-10 bg-background pr-4")}
        >
          <SubjectCatalogueColumn
            catalogue={catalogue}
            emptyLabel={debouncedSearch ? "Aucun résultat" : "Créez des matières avec le bouton +"}
            actions={{
              onEdit: setEditId,
              onDelete: (id, name) => setDeleteTarget({ id, name }),
              onDragStart: scroll.start,
              onDragEnd: scroll.stop,
            }}
          />
        </div>

        {levels.map((level) => (
          <SubjectLevelColumn
            key={level.id}
            level={level}
            subjects={filteredSubjects.filter((s) => s.level_id === level.id)}
            series={allSeries.filter((s) => s.level_id === level.id)}
            dragOverTarget={dragOverTarget}
            actions={{
              onDrop: handleDrop,
              onEdit: setEditId,
              onDelete: (id, name) => setDeleteTarget({ id, name }),
              setDragOverTarget,
            }}
          />
        ))}
      </div>

      <SubjectAssignModal
        target={assignTarget}
        levels={levels}
        series={allSeries}
        instances={subjects}
        open={assignTarget !== null}
        onClose={() => setAssignTarget(null)}
      />

      <SubjectEditModal subjectId={editId} open={editId !== null} onClose={() => setEditId(null)} />

      <Dialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la matière</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. La matière "{deleteTarget?.name}" sera définitivement supprimée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deleteTarget) {
                  deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })
                }
              }}
            >
              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
