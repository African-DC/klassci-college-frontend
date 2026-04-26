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
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { useSubjects, useDeleteSubject } from "@/lib/hooks/useSubjects"
import { useLevels } from "@/lib/hooks/useLevels"
import { useSeriesList } from "@/lib/hooks/useSeries"
import { useTeachers } from "@/lib/hooks/useTeachers"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SubjectEditModal } from "./SubjectEditModal"
import { useDebounce } from "@/lib/hooks/useDebounce"

// ---------------------------------------------------------------------------
// Color mapping
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
// Assign modal form
// ---------------------------------------------------------------------------

interface AssignTarget {
  subjectId: number
  subjectName: string
  levelId: number
  levelName: string
  seriesId: number | null
  defaultCoef: number
  defaultHours: number
}

function AssignModal({
  target,
  series,
  open,
  onClose,
}: {
  target: AssignTarget | null
  series: { id: number; name: string }[]
  open: boolean
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const { data: teachersData } = useTeachers({ size: 100 })
  const teachers = teachersData?.items ?? []
  const [coef, setCoef] = useState(target?.defaultCoef ?? 1)
  const [hours, setHours] = useState(target?.defaultHours ?? 2)
  const [seriesId, setSeriesId] = useState<number | null>(target?.seriesId ?? null)
  const [teacherId, setTeacherId] = useState<number | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit() {
    if (!target) return
    setIsPending(true)
    setError(null)
    duplicateSubject({
      subject_id: target.subjectId,
      level_id: target.levelId,
      series_id: seriesId,
      coefficient: coef,
      hours_per_week: hours,
      teacher_id: teacherId,
    })
      .then(() => {
        toast.success(`${target.subjectName} assignée à ${target.levelName}`)
        queryClient.invalidateQueries({ queryKey: ["subjects"] })
        onClose()
      })
      .catch((err: Error) => {
        setError(err.message)
      })
      .finally(() => setIsPending(false))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Assigner à {target?.levelName}</DialogTitle>
          <DialogDescription>
            Configurer {target?.subjectName} pour ce niveau
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {series.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Série (optionnel)</label>
              <Select
                value={seriesId?.toString() ?? "none"}
                onValueChange={(v) => setSeriesId(v === "none" ? null : Number(v))}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Toutes séries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Toutes séries</SelectItem>
                  {series.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      Série {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Teacher select */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Enseignant</label>
            <Select
              value={teacherId?.toString() ?? "none"}
              onValueChange={(v) => setTeacherId(v === "none" ? null : Number(v))}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Sélectionner un enseignant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun (à assigner plus tard)</SelectItem>
                {teachers.map((t) => (
                  <SelectItem key={t.id} value={t.id.toString()}>
                    {t.first_name} {t.last_name} {t.speciality ? `(${t.speciality})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Coefficient</label>
              <Input
                type="number"
                min={1}
                value={coef}
                onChange={(e) => setCoef(Number(e.target.value) || 1)}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Heures / semaine</label>
              <Input
                type="number"
                min={1}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value) || 1)}
                className="h-10"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Assignation..." : "Assigner"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
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
  const [assignTarget, setAssignTarget] = useState<AssignTarget | null>(null)
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
      s.level_name?.toLowerCase().includes(q)
    )
  }, [subjects, debouncedSearch])

  // Catalogue = subjects without level_id
  const catalogue = useMemo(
    () => filteredSubjects.filter((s) => s.level_id === null),
    [filteredSubjects],
  )

  function handleDrop(subjectId: number, levelId: number, levelName: string, seriesId: number | null) {
    const source = subjects.find((s) => s.id === subjectId)
    if (!source) return

    // Get series for this level
    const levelSeries = allSeries.filter((s) => s.level_id === levelId)

    setAssignTarget({
      subjectId,
      subjectName: source.name,
      levelId,
      levelName,
      seriesId,
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
        {/* Catalogue */}
        <div className="w-72 shrink-0 rounded-lg border bg-card shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-primary/5">
            <div className="flex items-center gap-2">
              <BookMarked className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">Catalogue</span>
              <Badge variant="secondary" className="text-xs">{catalogue.length}</Badge>
            </div>
          </div>
          <div className="p-2 space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
            {catalogue.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground italic">
                {debouncedSearch ? "Aucun résultat" : "Créez des matières avec le bouton +"}
              </div>
            ) : (
              catalogue.map((s) => (
                <SubjectCard
                  key={s.id}
                  subject={s}
                  isDraggable
                  isCatalogue
                  onEdit={() => setEditId(s.id)}
                  onDelete={() => setDeleteTarget({ id: s.id, name: s.name })}
                />
              ))
            )}
          </div>
        </div>

        {/* Level columns */}
        {levels.map((level) => {
          const levelSubjects = filteredSubjects.filter((s) => s.level_id === level.id)
          const levelSeries = allSeries.filter((s) => s.level_id === level.id)

          return (
            <LevelColumn
              key={level.id}
              level={level}
              subjects={levelSubjects}
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

      {/* Assign modal */}
      <AssignModal
        target={assignTarget}
        series={assignTarget ? allSeries.filter((s) => s.level_id === assignTarget.levelId) : []}
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

// ---------------------------------------------------------------------------
// Level column with series sub-groups
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
  onDrop: (subjectId: number, levelId: number, levelName: string, seriesId: number | null) => void
  onEdit: (id: number) => void
  onDelete: (id: number, name: string) => void
}) {
  const totalHours = subjects.reduce((sum, s) => sum + s.hours_per_week, 0)
  const key = `level-${level.id}`
  const isDragOver = dragOverTarget === key
  const hasSeries = series.length > 0
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
        if (subjectId) onDrop(subjectId, level.id, level.name, null)
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
                if (subjectId) onDrop(subjectId, level.id, level.name, ser.id)
              }}
            >
              <p className="text-[10px] font-medium text-muted-foreground px-1 mb-1">
                Série {ser.name}
              </p>
              {seriesSubjects.length === 0 ? (
                <p className="text-[10px] text-muted-foreground/60 italic px-1 py-2">Déposer ici</p>
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
// Subject card
// ---------------------------------------------------------------------------

function SubjectCard({
  subject,
  isDraggable,
  isCatalogue,
  onEdit,
  onDelete,
}: {
  subject: Subject
  isDraggable?: boolean
  isCatalogue?: boolean
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
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1.5">
          {isDraggable && <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />}
          <h4 className={`font-semibold text-sm leading-tight ${color.text}`}>
            {subject.name}
          </h4>
        </div>
        {!isCatalogue && (
          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-white text-xs font-bold shrink-0 ml-2 ${color.badge}`}>
            {subject.coefficient}
          </div>
        )}
        {isCatalogue && (
          <div className={`h-3 w-3 rounded-full shrink-0 ml-2 ${color.badge}`} />
        )}
      </div>

      {/* Only show coef/hours for assigned subjects (not catalogue) */}
      {!isCatalogue && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{subject.hours_per_week}h/sem</span>
          </div>
          <div className="flex items-center gap-1">
            <Award className="h-3 w-3" />
            <span>Coef. {subject.coefficient}</span>
          </div>
        </div>
      )}
      {!isCatalogue && subject.teacher_name && (
        <p className="text-[10px] text-muted-foreground mt-1 truncate">
          Prof. {subject.teacher_name}
        </p>
      )}

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
