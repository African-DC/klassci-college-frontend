"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { DataError } from "@/components/shared/DataError"
import {
  useClassSubjectTeachers,
  useSaveClassSubjectTeachers,
} from "@/lib/hooks/useClassSubjectTeachers"
import { ClassSubjectTeacherRow } from "./ClassSubjectTeacherRow"
import {
  buildDraft,
  changedAssignments,
  messageFromError,
} from "./class-teachers-helpers"

interface ClassSubjectTeachersPanelProps {
  classId: number
  onSaved?: () => void
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

export function ClassSubjectTeachersPanel({ classId, onSaved }: ClassSubjectTeachersPanelProps) {
  const { data, isLoading, isError, error, refetch } = useClassSubjectTeachers(classId)
  const saveMutation = useSaveClassSubjectTeachers(classId)
  // Seules les modifications faites à la main sont gardées ; le reste suit le serveur.
  const [overrides, setOverrides] = useState<Record<number, number | null>>({})

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

  const draft = { ...buildDraft(data.items), ...overrides }
  const changes = changedAssignments(data.items, draft)

  function handleSave() {
    saveMutation.mutate(changes, {
      onSuccess: () => {
        setOverrides({})
        toast.success("Enseignants de la classe enregistrés")
        onSaved?.()
      },
      onError: (err) => {
        toast.error("Enregistrement impossible", { description: messageFromError(err) })
      },
    })
  }

  const saving = saveMutation.isPending

  return (
    <div className="space-y-4">
      <PanelHeader missing={data.missing_count} />

      <div className="hidden grid-cols-[minmax(0,1fr)_6rem_minmax(0,16rem)_7.5rem] gap-4 border-b px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:grid">
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
            onChange={(teacherId) =>
              setOverrides((prev) => ({ ...prev, [item.subject_id]: teacherId }))
            }
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
