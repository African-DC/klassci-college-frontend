"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { useSubjects, useDeleteSubject } from "@/lib/hooks/useSubjects"
import { useLevels } from "@/lib/hooks/useLevels"
import type { Subject } from "@/lib/contracts/subject"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { SubjectEditModal } from "./SubjectEditModal"
import { SubjectGroupRow, SUBJECT_GRID_COLS, type SubjectGroup } from "./SubjectGroupRow"
import { useDebounce } from "@/lib/hooks/useDebounce"

export function SubjectsTable() {
  const [search, setSearch] = useState("")
  const [levelFilter, setLevelFilter] = useState<string>("all")
  const [teacherFilter, setTeacherFilter] = useState<string>("all")
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null)

  const debouncedSearch = useDebounce(search)
  const { data: subjectsData, isLoading } = useSubjects({ size: 100 })
  const { data: levelsData } = useLevels({ size: 100 })
  const deleteMutation = useDeleteSubject()

  const subjects = useMemo(() => subjectsData?.items ?? [], [subjectsData])
  const levels = useMemo(
    () => levelsData?.items?.slice().sort((a, b) => a.order - b.order) ?? [],
    [levelsData],
  )

  // Group subjects by name. Catalogue (level_id null) is the anchor;
  // every level-scoped row of the same name becomes an instance under it.
  const groups = useMemo<SubjectGroup[]>(() => {
    const levelOrder = new Map(levels.map((l, i) => [l.id, l.order ?? i]))
    const map = new Map<string, SubjectGroup>()

    for (const s of subjects) {
      const existing = map.get(s.name)
      const isCatalogue = s.level_id === null

      if (!existing) {
        map.set(s.name, {
          name: s.name,
          catalogue: isCatalogue ? s : null,
          instances: isCatalogue ? [] : [s],
          totalHours: isCatalogue ? 0 : s.hours_per_week,
        })
      } else if (isCatalogue) {
        existing.catalogue = s
      } else {
        existing.instances.push(s)
        existing.totalHours += s.hours_per_week
      }
    }

    for (const group of map.values()) {
      group.instances.sort(
        (a, b) =>
          (levelOrder.get(a.level_id ?? 0) ?? 99) -
          (levelOrder.get(b.level_id ?? 0) ?? 99),
      )
    }

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "fr"),
    )
  }, [subjects, levels])

  const filteredGroups = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase()
    return groups.filter((group) => {
      if (query) {
        const matchName = group.name.toLowerCase().includes(query)
        const matchTeacher = group.instances.some((inst) =>
          inst.teacher_name?.toLowerCase().includes(query),
        )
        if (!matchName && !matchTeacher) return false
      }

      if (levelFilter === "catalogue") {
        if (group.catalogue === null) return false
      } else if (levelFilter !== "all") {
        const lid = Number(levelFilter)
        if (!group.instances.some((inst) => inst.level_id === lid)) return false
      }

      if (teacherFilter === "with") {
        if (!group.instances.some((inst) => inst.teacher_id !== null && inst.teacher_id !== undefined)) {
          return false
        }
      } else if (teacherFilter === "without") {
        if (group.instances.length === 0) return false
        if (!group.instances.some((inst) => !inst.teacher_id)) return false
      }

      return true
    })
  }, [groups, debouncedSearch, levelFilter, teacherFilter])

  const totalInstances = useMemo(
    () => subjects.filter((s) => s.level_id !== null).length,
    [subjects],
  )
  const totalHours = useMemo(
    () =>
      subjects
        .filter((s) => s.level_id !== null)
        .reduce((sum, s) => sum + s.hours_per_week, 0),
    [subjects],
  )

  function toggleExpanded(name: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  function expandAll() {
    setExpanded(new Set(filteredGroups.filter((g) => g.instances.length > 0).map((g) => g.name)))
  }
  function collapseAll() {
    setExpanded(new Set())
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* KPI hero strip */}
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold text-primary tabular-nums">
            {groups.length}
          </span>
          <span className="text-sm text-muted-foreground">matières uniques</span>
        </div>
        <span className="text-border" aria-hidden>·</span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold tabular-nums">{totalInstances}</span>
          <span className="text-sm text-muted-foreground">instances par niveau</span>
        </div>
        <span className="text-border" aria-hidden>·</span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold tabular-nums">{totalHours}h</span>
          <span className="text-sm text-muted-foreground">/ semaine au total</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher matière ou enseignant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
            aria-label="Rechercher une matière"
          />
        </div>

        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="h-10 min-w-[170px]" aria-label="Filtrer par niveau">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous niveaux</SelectItem>
            <SelectItem value="catalogue">Catalogue seul</SelectItem>
            {levels.map((l) => (
              <SelectItem key={l.id} value={String(l.id)}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={teacherFilter} onValueChange={setTeacherFilter}>
          <SelectTrigger className="h-10 min-w-[180px]" aria-label="Filtrer par enseignant">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous enseignants</SelectItem>
            <SelectItem value="with">Avec enseignant</SelectItem>
            <SelectItem value="without">Sans enseignant</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={expandAll}>
            Tout déplier
          </Button>
          <Button variant="ghost" size="sm" onClick={collapseAll}>
            Tout replier
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <div
          className={`grid ${SUBJECT_GRID_COLS} gap-3 border-b bg-muted/40 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground`}
        >
          <div />
          <div>Matière</div>
          <div className="text-center">Coef.</div>
          <div className="text-center">Heures</div>
          <div>Statut / Enseignant</div>
          <div className="text-right">Actions</div>
        </div>

        {filteredGroups.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            Aucune matière ne correspond à ces filtres.
          </div>
        ) : (
          <ul className="divide-y">
            {filteredGroups.map((group) => (
              <SubjectGroupRow
                key={group.name}
                group={group}
                expanded={expanded.has(group.name)}
                onToggle={() => toggleExpanded(group.name)}
                onEdit={setEditId}
                onDelete={setDeleteTarget}
              />
            ))}
          </ul>
        )}
      </div>

      <SubjectEditModal
        subjectId={editId}
        open={editId !== null}
        onClose={() => setEditId(null)}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la matière</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.name}
              {deleteTarget?.level_name ? ` · ${deleteTarget.level_name}` : ""} sera
              définitivement supprimée. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deleteTarget) {
                  deleteMutation.mutate(deleteTarget.id, {
                    onSuccess: () => setDeleteTarget(null),
                  })
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
