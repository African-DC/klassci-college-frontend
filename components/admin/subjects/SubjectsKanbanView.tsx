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
} from "lucide-react"
import { useSubjects, useDeleteSubject } from "@/lib/hooks/useSubjects"
import { useLevels } from "@/lib/hooks/useLevels"
import type { Subject } from "@/lib/contracts/subject"
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

// Color palette for subjects — deterministic based on name
const SUBJECT_COLORS = [
  { bg: "bg-blue-500/10", text: "text-blue-700", border: "border-blue-200", badge: "bg-blue-500" },
  { bg: "bg-emerald-500/10", text: "text-emerald-700", border: "border-emerald-200", badge: "bg-emerald-500" },
  { bg: "bg-amber-500/10", text: "text-amber-700", border: "border-amber-200", badge: "bg-amber-500" },
  { bg: "bg-violet-500/10", text: "text-violet-700", border: "border-violet-200", badge: "bg-violet-500" },
  { bg: "bg-rose-500/10", text: "text-rose-700", border: "border-rose-200", badge: "bg-rose-500" },
  { bg: "bg-cyan-500/10", text: "text-cyan-700", border: "border-cyan-200", badge: "bg-cyan-500" },
  { bg: "bg-orange-500/10", text: "text-orange-700", border: "border-orange-200", badge: "bg-orange-500" },
  { bg: "bg-indigo-500/10", text: "text-indigo-700", border: "border-indigo-200", badge: "bg-indigo-500" },
]

function getSubjectColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length]
}

export function SubjectsKanbanView() {
  const { data: subjectsData, isLoading: subjectsLoading } = useSubjects({ size: 100 })
  const { data: levelsData, isLoading: levelsLoading } = useLevels({ size: 100 })
  const deleteMutation = useDeleteSubject()

  const [editId, setEditId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search)

  const isLoading = subjectsLoading || levelsLoading
  const subjects = subjectsData?.items ?? []
  const levels = levelsData?.items?.sort((a, b) => a.order - b.order) ?? []

  // Filter subjects by search
  const filteredSubjects = useMemo(() => {
    if (!debouncedSearch) return subjects
    const q = debouncedSearch.toLowerCase()
    return subjects.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      s.level_name?.toLowerCase().includes(q) ||
      s.series_name?.toLowerCase().includes(q)
    )
  }, [subjects, debouncedSearch])

  // Group subjects by level
  const columns = useMemo(() => {
    const byLevel = new Map<number | null, Subject[]>()
    // Init with all levels
    for (const level of levels) {
      byLevel.set(level.id, [])
    }
    byLevel.set(null, []) // "Toutes niveaux" column

    for (const s of filteredSubjects) {
      const key = s.level_id
      if (!byLevel.has(key)) byLevel.set(key, [])
      byLevel.get(key)!.push(s)
    }

    return byLevel
  }, [filteredSubjects, levels])

  // Stats
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
      {/* Stats + Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{totalSubjects} matières</span>
          <span className="text-border">|</span>
          <span>{totalHours}h / semaine au total</span>
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

      {/* Kanban columns */}
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
        {/* General subjects (no level) */}
        {(columns.get(null)?.length ?? 0) > 0 && (
          <KanbanColumn
            title="Toutes niveaux"
            icon={<BookOpen className="h-4 w-4" />}
            subjects={columns.get(null) ?? []}
            onEdit={setEditId}
            onDelete={(id, name) => setDeleteTarget({ id, name })}
          />
        )}

        {/* Level columns */}
        {levels.map((level) => {
          const levelSubjects = columns.get(level.id) ?? []
          if (levelSubjects.length === 0 && debouncedSearch) return null
          return (
            <KanbanColumn
              key={level.id}
              title={level.name}
              icon={<GraduationCap className="h-4 w-4" />}
              subjects={levelSubjects}
              onEdit={setEditId}
              onDelete={(id, name) => setDeleteTarget({ id, name })}
            />
          )
        })}
      </div>

      {/* Edit modal */}
      <SubjectEditModal
        subjectId={editId}
        open={editId !== null}
        onClose={() => setEditId(null)}
      />

      {/* Delete dialog */}
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
                  deleteMutation.mutate(deleteTarget.id, {
                    onSuccess: () => setDeleteTarget(null),
                  })
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

function KanbanColumn({
  title,
  icon,
  subjects,
  onEdit,
  onDelete,
}: {
  title: string
  icon: React.ReactNode
  subjects: Subject[]
  onEdit: (id: number) => void
  onDelete: (id: number, name: string) => void
}) {
  const totalHours = subjects.reduce((sum, s) => sum + s.hours_per_week, 0)

  return (
    <div className="w-72 shrink-0 rounded-lg border bg-muted/30">
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <span className="text-primary">{icon}</span>
          <span className="font-semibold text-sm">{title}</span>
          <Badge variant="secondary" className="text-xs">
            {subjects.length}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">{totalHours}h</span>
      </div>

      {/* Cards */}
      <div className="p-2 space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
        {subjects.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground italic">
            Aucune matière
          </div>
        ) : (
          subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              onEdit={() => onEdit(subject.id)}
              onDelete={() => onDelete(subject.id, subject.name)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function SubjectCard({
  subject,
  onEdit,
  onDelete,
}: {
  subject: Subject
  onEdit: () => void
  onDelete: () => void
}) {
  const color = getSubjectColor(subject.name)

  return (
    <div
      className={`group relative rounded-lg border p-3 transition-all hover:shadow-md ${color.bg} ${color.border}`}
    >
      {/* Name + Coefficient */}
      <div className="flex items-start justify-between mb-2">
        <h4 className={`font-semibold text-sm leading-tight ${color.text}`}>
          {subject.name}
        </h4>
        <div className={`flex h-7 w-7 items-center justify-center rounded-full text-white text-xs font-bold shrink-0 ${color.badge}`}>
          {subject.coefficient}
        </div>
      </div>

      {/* Meta */}
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

      {/* Series badge */}
      {subject.series_name && (
        <div className="mt-2">
          <Badge variant="outline" className="text-[10px]">
            Série {subject.series_name}
          </Badge>
        </div>
      )}

      {/* Hover actions */}
      <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onEdit}>
          <Pencil className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDelete}>
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </div>
    </div>
  )
}
