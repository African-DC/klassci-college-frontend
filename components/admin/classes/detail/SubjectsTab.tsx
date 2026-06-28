"use client"

import { BookOpen, User } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { DataError } from "@/components/shared/DataError"
import { useTimetable } from "@/lib/hooks/useTimetable"
import { SectionCard, EmptyState, StatusPill } from "@/components/admin/students/tabs/_primitives"
import { deriveSubjects } from "./class-helpers"

interface SubjectsTabProps {
  classId: number
}

export function SubjectsTab({ classId }: SubjectsTabProps) {
  const { data, isLoading, isError, error, refetch } = useTimetable(classId)
  const subjects = deriveSubjects(data ?? [])

  return (
    <SectionCard
      icon={<BookOpen className="h-4 w-4" />}
      title="Matières"
      description={isLoading ? undefined : `${subjects.length} matière${subjects.length > 1 ? "s" : ""} enseignée${subjects.length > 1 ? "s" : ""}`}
    >
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <DataError message={error?.message ?? "Erreur de chargement"} error={error} onRetry={refetch} />
      ) : subjects.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-5 w-5" />}
          title="Aucune matière"
          message="Les matières apparaîtront ici dès qu'un emploi du temps sera défini pour la classe."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {subjects.map((s) => (
            <div
              key={s.subject_id}
              className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/40 p-4"
            >
              <span
                className="mt-1 h-3.5 w-3.5 shrink-0 rounded-full"
                style={{ backgroundColor: s.subject_color ?? "#0F3F8C" }}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{s.subject_name}</p>
                  <StatusPill tone="neutral">{s.slot_count} cours</StatusPill>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <User className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">
                    {s.teacher_names.length > 0
                      ? s.teacher_names.join(", ")
                      : "Aucun enseignant affecté"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
