"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { DataError } from "@/components/shared/DataError"
import { cn } from "@/lib/utils"
import {
  useClassSubjectTeachers,
  useSaveClassSubjectTeachers,
} from "@/lib/hooks/useClassSubjectTeachers"
import type { ClassSubjectTeachers } from "@/lib/contracts/class-subject-teachers"
import { ClassSubjectTeacherRow } from "./ClassSubjectTeacherRow"
import {
  buildDraft,
  changedAssignments,
  countMissing,
  type TeacherDraft,
} from "./class-teachers-helpers"
import { SUBJECT_GRID_COLUMNS } from "./class-teachers-styles"

interface ClassSubjectTeachersPanelProps {
  classId: number
  onSaved?: () => void
  onDirtyChange?: (dirty: boolean) => void
}

/** Choix faits à la main, rattachés à la réponse serveur dont ils partent. */
interface PanelEdits {
  source: ClassSubjectTeachers
  values: TeacherDraft
}

function PanelHeader({ missing }: { missing: number }) {
  if (missing === 0) {
    return (
      <p className="text-sm text-emerald-700 dark:text-emerald-300">
        Toutes les matières ont un enseignant.
      </p>
    )
  }
  return (
    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
      {missing} matière{missing > 1 ? "s" : ""} à compléter
    </p>
  )
}

export function ClassSubjectTeachersPanel({
  classId,
  onSaved,
  onDirtyChange,
}: ClassSubjectTeachersPanelProps) {
  const { data, isLoading, isError, error, refetch } = useClassSubjectTeachers(classId)
  const saveMutation = useSaveClassSubjectTeachers(classId)
  const [edits, setEdits] = useState<PanelEdits | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (isError || !data) {
    return (
      <DataError
        message={error?.message ?? "Impossible de charger les enseignants de la classe"}
        error={error}
        onRetry={refetch}
      />
    )
  }

  if (data.items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/30 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Aucune matière n&apos;est définie pour le niveau de cette classe.
        </p>
        <Link
          href="/admin/subjects"
          className="mt-3 inline-flex h-11 items-center text-sm font-medium text-primary underline underline-offset-2"
        >
          Gérer les matières
        </Link>
      </div>
    )
  }

  const source: ClassSubjectTeachers = data
  const values = edits?.source === source ? edits.values : {}
  const draft: TeacherDraft = { ...buildDraft(source.items), ...values }
  const changes = changedAssignments(source.items, draft)
  const missing = countMissing(source.items, draft)

  function handleChange(subjectId: number, teacherId: number | null) {
    const nextValues = { ...values, [subjectId]: teacherId }
    setEdits({ source, values: nextValues })
    const nextDraft = { ...buildDraft(source.items), ...nextValues }
    onDirtyChange?.(changedAssignments(source.items, nextDraft).length > 0)
  }

  function handleSave() {
    saveMutation.mutate(changes, {
      onSuccess: () => {
        setEdits(null)
        onDirtyChange?.(false)
        toast.success("Enseignants de la classe enregistrés")
        onSaved?.()
      },
      onError: (err) => {
        toast.error("Enregistrement impossible", {
          description: err instanceof Error && err.message ? err.message : "Erreur inconnue",
        })
      },
    })
  }

  const saving = saveMutation.isPending

  return (
    <div className="space-y-4">
      <PanelHeader missing={missing} />

      <div
        className={cn(
          "hidden gap-4 border-b px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:grid",
          SUBJECT_GRID_COLUMNS,
        )}
      >
        <span>Matière</span>
        <span>Volume</span>
        <span>Enseignant</span>
        <span className="justify-self-end">Statut</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:block lg:gap-0">
        {data.items.map((item) => (
          <ClassSubjectTeacherRow
            key={item.subject_id}
            item={item}
            value={draft[item.subject_id] ?? null}
            disabled={saving}
            onChange={(teacherId) => handleChange(item.subject_id, teacherId)}
          />
        ))}
      </div>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t bg-background/95 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <p className="hidden text-xs text-muted-foreground sm:block">
          {changes.length > 0
            ? `${changes.length} modification${changes.length > 1 ? "s" : ""} non enregistrée${changes.length > 1 ? "s" : ""}`
            : "Aucune modification"}
        </p>
        <Button
          type="button"
          onClick={handleSave}
          disabled={changes.length === 0 || saving}
          className="h-11 w-full sm:w-auto sm:min-w-40"
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
          {saving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </div>
  )
}
