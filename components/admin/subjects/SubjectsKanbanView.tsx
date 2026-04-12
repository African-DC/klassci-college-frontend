"use client"

import { useMemo, useState } from "react"
import {
  BookOpen,
  Clock,
  Award,
  Pencil,
  Trash2,
  GraduationCap,
  Search,
  GripVertical,
  BookMarked,
} from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { useSubjects, useDeleteSubject } from "@/lib/hooks/useSubjects"
import { useLevels } from "@/lib/hooks/useLevels"
import { useSeriesList } from "@/lib/hooks/useSeries"
import { duplicateSubject } from "@/lib/api/subjects"
import type { Subject } from "@/lib/contracts/subject"
import type { Level } from "@/lib/contracts/level"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { useDebounce } from "@/lib/hooks/useDebounce"

// ---------------------------------------------------------------------------
// Color mapping from DB value to Tailwind classes
// ---------------------------------------------------------------------------

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  blue: { bg: "bg-blue-500/10", text: "text-blue-700", border: "border-blue-200", badge: "bg-blue-600" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-700", border: "border-emerald-200", badge: "bg-emerald-600" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-700", border: "border-amber-200", badge: "bg-amber-600" },
  violet: { bg: "bg-violet-500/10", text: "text-violet-700", border: "border-violet-200", badge: "bg-violet-600" },
  rose: { bg: "bg-rose-500/10", text: "text-rose-700", border: "border-rose-200", badge: "bg-rose-500" },
  cyan: { bg: "bg-cyan-500/10", text: "text-cyan-700", border: "border-cyan-200", badge: "bg-cyan-600" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-700", border: "border-orange-200", badge: "bg-orange-500" },
  indigo: { bg: "bg-indigo-500/10", text: "text-indigo-700", border: "border-indigo-200", badge: "bg-indigo-600" },
  teal: { bg: "bg-teal-500/10", text: "text-teal-700", border: "border-teal-200", badge: "bg-teal-600" },
  red: { bg: "bg-red-500/10", text: "text-red-700", border: "border-red-200", badge: "bg-red-500" },
  green: { bg: "bg-green-500/10", text: "text-green-700", border: "border-green-200", badge: "bg-green-600" },
  pink: { bg: "bg-pink-500/10", text: "text-pink-700", border: "border-pink-200", badge: "bg-pink-500" },
}

const DEFAULT_COLOR = { bg: "bg-slate-500/10", text: "text-slate-700", border: "border-slate-200", badge: "bg-slate-500" }

function getColor(color: string | null | undefined) {
  if (!color) return DEFAULT_COLOR
  return COLOR_MAP[color] ?? DEFAULT_COLOR
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SubjectsKanbanView() {
  const queryClient = useQueryClient()
  const { data: subjectsData, isLoading: subjectsLoading } = useSubjects({ size: 100 })
  const { data: levelsData, isLoading: levelsLoading } = useLevels({ size: 100 })
  const { data: seriesData } = useSeriesList({ size: 100 })
  const deleteMutation = useDeleteSubject()

  const [editId, setEditId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)
  const [search, setSearch] = useState("")
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null)
  const debouncedSearch = useDebounce(search)

  const isLoading = subjectsLoading || levelsLoading
  const subjects = subjectsData?.items ?? []
  const levels = levelsData?.items?.sort((a, b) => a.order - b.order) ?? []
  const allSeries = seriesData?.items ?? []

  const filteredSubjects = useMemo(() => {
    if (!debouncedSearch) return subjects
    const q = debouncedSearch.toLowerCase()
    return subjects.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      s.level_name?.toLowerCase().includes(q) ||
      s.series_name?.toLowerCase().includes(q)
    )
  }, [subjects, debouncedSearch])

  // Group subjects: null level = reservoir, others by level_id
  const reservoir = useMemo(
    () => filteredSubjects.filter((s) => s.level_id === null),
    [filteredSubjects],
  )

  function handleDrop(subjectId: number, levelId: number, seriesId: number | null) {
    duplicateSubject({ subject_id: subjectId, level_id: levelId, series_id: seriesId })
      .then(() => {
        toast.success("Matière assignée au niveau")
        queryClient.invalidateQueries({ queryKey: ["subjects"] })
      })
      .catch((err: Error) => {
        toast.error("Erreur", { description: err.message })
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
          <span className="text-xs italic">Glisser une matière vers un niveau pour l'assigner</span>
        </div>
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une matière..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
        {/* Reservoir: all-levels subjects */}
        <KanbanColumn
          title="Toutes niveaux"
          icon={<BookMarked className="h-4 w-4" />}
          subjects={reservoir}
          isDraggable
          onEdit={setEditId}
          onDelete={(id, name) => setDeleteTarget({ id, name })}
        />

        {/* Level columns */}
        {levels.map((level) => {
          const levelSubjects = filteredSubjects.filter((s) => s.level_id === level.id)
          const levelSeries = allSeries.filter((s) => s.level_id === level.id)

          // Include "all levels" subjects (level_id=null) in every column
          const allLevelSubjects = [...levelSubjects, ...reservoir]

          return (
            <LevelColumn
              key={level.id}
              level={level}
              subjects={allLevelSubjects}
              series={levelSeries}
              dragOverTarget={dragOverTarget}
              setDragOverTarget={setDragOverTarget}
              onDrop={handleDrop}
              onEdit={setEditId}
              onDelete={(id, name) => setDeleteTarget({ id, name })}
            />
          )
        })}
      </div>

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

// ---------------------------------------------------------------------------
// Level column with optional series sub-groups
// ---------------------------------------------------------------------------

function LevelColumn({
  level,
  subjects,
  series,
  dragOverTarget,
  setDragOverTarget,
  onDrop,
  onEdit,
  onDelete,
}: {
  level: Level
  subjects: Subject[]
  series: { id: number; name: string }[]
  dragOverTarget: string | null
  setDragOverTarget: (t: string | null) => void
  onDrop: (subjectId: number, levelId: number, seriesId: number | null) => void
  onEdit: (id: number) => void
  onDelete: (id: number, name: string) => void
}) {
  const totalHours = subjects.reduce((sum, s) => sum + s.hours_per_week, 0)
  const key = `level-${level.id}`
  const isDragOver = dragOverTarget === key
  const hasSeries = series.length > 0

  // Subjects without series in this level
  const directSubjects = subjects.filter((s) => !s.series_id)

  return (
    <div
      className={`w-72 shrink-0 rounded-lg border transition-colors ${
        isDragOver ? "ring-2 ring-primary/40 bg-primary/5" : "bg-muted/30"
      }`}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; setDragOverTarget(key) }}
      onDragLeave={() => setDragOverTarget(null)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOverTarget(null)
        const subjectId = Number(e.dataTransfer.getData("subjectId"))
        if (subjectId) onDrop(subjectId, level.id, null)
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">{level.name}</span>
          <Badge variant="secondary" className="text-xs">{subjects.length}</Badge>
        </div>
        <span className="text-xs text-muted-foreground">{totalHours}h</span>
      </div>

      <div className="p-2 space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto">
        {/* Direct subjects (no series) */}
        {directSubjects.map((s) => (
          <SubjectCard key={s.id} subject={s} onEdit={() => onEdit(s.id)} onDelete={() => onDelete(s.id, s.name)} />
        ))}

        {/* Series sub-groups */}
        {hasSeries && series.map((ser) => {
          const seriesSubjects = subjects.filter((s) => s.series_id === ser.id)
          const seriesKey = `series-${ser.id}`
          const isSeriesDragOver = dragOverTarget === seriesKey

          return (
            <div
              key={ser.id}
              className={`rounded-md border border-dashed p-1.5 mt-1 transition-colors ${
                isSeriesDragOver ? "border-accent bg-accent/5" : "border-border/50"
              }`}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = "copy"; setDragOverTarget(seriesKey) }}
              onDragLeave={(e) => { e.stopPropagation(); setDragOverTarget(null) }}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setDragOverTarget(null)
                const subjectId = Number(e.dataTransfer.getData("subjectId"))
                if (subjectId) onDrop(subjectId, level.id, ser.id)
              }}
            >
              <p className="text-[10px] font-medium text-muted-foreground px-1 mb-1">
                Série {ser.name}
              </p>
              {seriesSubjects.length === 0 ? (
                <p className="text-[10px] text-muted-foreground/60 italic px-1 py-2">
                  Déposer ici
                </p>
              ) : (
                seriesSubjects.map((s) => (
                  <SubjectCard key={s.id} subject={s} onEdit={() => onEdit(s.id)} onDelete={() => onDelete(s.id, s.name)} />
                ))
              )}
            </div>
          )
        })}

        {subjects.length === 0 && !hasSeries && (
          <div className="py-8 text-center text-xs text-muted-foreground italic">
            Déposer une matière ici
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Generic column (for reservoir)
// ---------------------------------------------------------------------------

function KanbanColumn({
  title,
  icon,
  subjects,
  isDraggable,
  onEdit,
  onDelete,
}: {
  title: string
  icon: React.ReactNode
  subjects: Subject[]
  isDraggable?: boolean
  onEdit: (id: number) => void
  onDelete: (id: number, name: string) => void
}) {
  const totalHours = subjects.reduce((sum, s) => sum + s.hours_per_week, 0)

  return (
    <div className="w-72 shrink-0 rounded-lg border bg-card shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-primary/5">
        <div className="flex items-center gap-2">
          <span className="text-primary">{icon}</span>
          <span className="font-semibold text-sm">{title}</span>
          <Badge variant="secondary" className="text-xs">{subjects.length}</Badge>
        </div>
        <span className="text-xs text-muted-foreground">{totalHours}h</span>
      </div>

      <div className="p-2 space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
        {subjects.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground italic">
            Aucune matière
          </div>
        ) : (
          subjects.map((s) => (
            <SubjectCard
              key={s.id}
              subject={s}
              isDraggable={isDraggable}
              onEdit={() => onEdit(s.id)}
              onDelete={() => onDelete(s.id, s.name)}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Subject card
// ---------------------------------------------------------------------------

function SubjectCard({
  subject,
  isDraggable,
  onEdit,
  onDelete,
}: {
  subject: Subject
  isDraggable?: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const color = getColor(subject.color)

  return (
    <div
      className={`group rounded-lg border p-3 transition-all hover:shadow-md ${color.bg} ${color.border} ${
        isDraggable ? "cursor-grab active:cursor-grabbing" : ""
      }`}
      draggable={isDraggable}
      onDragStart={isDraggable ? (e) => {
        e.dataTransfer.setData("subjectId", String(subject.id))
        e.dataTransfer.effectAllowed = "copy"
      } : undefined}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {isDraggable && <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />}
          <h4 className={`font-semibold text-sm leading-tight ${color.text}`}>
            {subject.name}
          </h4>
        </div>
        <div className={`flex h-7 w-7 items-center justify-center rounded-full text-white text-xs font-bold shrink-0 ml-2 ${color.badge}`}>
          {subject.coefficient}
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{subject.hours_per_week}h/sem</span>
        </div>
        <div className="flex items-center gap-1">
          <Award className="h-3 w-3" />
          <span>Coef. {subject.coefficient}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        {subject.series_name ? (
          <Badge variant="outline" className="text-[10px]">Série {subject.series_name}</Badge>
        ) : <span />}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onEdit}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDelete}>
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  )
}
