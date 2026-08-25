"use client"

import { useMemo, useState } from "react"
import { useSubjects, useDeleteSubject } from "@/lib/hooks/useSubjects"
import { useLevels } from "@/lib/hooks/useLevels"
import { useSeriesList } from "@/lib/hooks/useSeries"
import type { Subject } from "@/lib/contracts/subject"
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
import { SubjectEditModal } from "./SubjectEditModal"
import { SubjectAssignModal, type AssignTarget } from "./SubjectAssignModal"
import { SubjectGroupRow, SUBJECT_GRID_COLS } from "./SubjectGroupRow"
import type { SubjectGroup } from "@/lib/contracts/subject-group"
import { SubjectMobileCard } from "./SubjectMobileCard"
import { SubjectsTableToolbar } from "./SubjectsTableToolbar"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { filterSubjectGroups, groupSubjects } from "@/lib/utils/subject-groups"

export function SubjectsTable() {
  const [search, setSearch] = useState("")
  const [levelFilter, setLevelFilter] = useState("all")
  const [teacherFilter, setTeacherFilter] = useState("all")
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null)
  const [assignTarget, setAssignTarget] = useState<AssignTarget | null>(null)

  const debouncedSearch = useDebounce(search)
  const { data: subjectsData, isLoading } = useSubjects({ size: 100 })
  const { data: levelsData } = useLevels({ size: 100 })
  const { data: seriesData } = useSeriesList({ size: 100 })
  const deleteMutation = useDeleteSubject()

  const subjects = useMemo(() => subjectsData?.items ?? [], [subjectsData])
  const levels = useMemo(
    () => levelsData?.items?.slice().sort((a, b) => a.order - b.order) ?? [],
    [levelsData],
  )
  const series = seriesData?.items ?? []
  const groups = useMemo(() => groupSubjects(subjects, levels), [subjects, levels])
  const filteredGroups = useMemo(
    () => filterSubjectGroups(groups, debouncedSearch, levelFilter, teacherFilter),
    [groups, debouncedSearch, levelFilter, teacherFilter],
  )

  function toggleExpanded(name: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  function startAssign(catalogue: Subject) {
    setAssignTarget({
      subjectId: catalogue.id,
      subjectName: catalogue.name,
      defaultCoef: catalogue.coefficient,
      defaultHours: catalogue.hours_per_week,
    })
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
      <SubjectsTableToolbar
        value={{ search, levelFilter, teacherFilter }}
        levels={levels}
        handlers={{
          onSearchChange: setSearch,
          onLevelFilterChange: setLevelFilter,
          onTeacherFilterChange: setTeacherFilter,
          onExpandAll: () => setExpanded(new Set(filteredGroups.filter((g) => g.instances.length > 0).map((g) => g.name))),
          onCollapseAll: () => setExpanded(new Set()),
        }}
      />

      <div className="space-y-2 md:hidden">
        {filteredGroups.length === 0 ? (
          <p className="rounded-lg border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            Aucune matière ne correspond à ces filtres.
          </p>
        ) : (
          filteredGroups.map((group) => (
            <SubjectMobileCard
              key={group.name}
              group={group}
              expanded={expanded.has(group.name)}
              onToggle={() => toggleExpanded(group.name)}
              onEdit={setEditId}
              onAssign={startAssign}
              onDelete={setDeleteTarget}
            />
          ))
        )}
      </div>

      <div className="hidden overflow-hidden rounded-lg border bg-card shadow-sm md:block">
        <div className={`grid ${SUBJECT_GRID_COLS} gap-3 border-b bg-muted/40 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground`}>
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
            {filteredGroups.map((group: SubjectGroup) => (
              <SubjectGroupRow
                key={group.name}
                group={group}
                expanded={expanded.has(group.name)}
                onToggle={() => toggleExpanded(group.name)}
                onEdit={setEditId}
                onAssign={startAssign}
                onDelete={setDeleteTarget}
              />
            ))}
          </ul>
        )}
      </div>

      <SubjectAssignModal
        target={assignTarget}
        levels={levels}
        series={series}
        instances={subjects}
        open={assignTarget !== null}
        onClose={() => setAssignTarget(null)}
        onAssigned={(name) => setExpanded((prev) => new Set(prev).add(name))}
      />
      <SubjectEditModal subjectId={editId} open={editId !== null} onClose={() => setEditId(null)} />

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
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
                  deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })
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
