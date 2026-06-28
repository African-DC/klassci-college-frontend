"use client"

import { BookOpen, GraduationCap } from "lucide-react"
import type { Route } from "next"
import { Skeleton } from "@/components/ui/skeleton"
import { DataError } from "@/components/shared/DataError"
import { useTimetable } from "@/lib/hooks/useTimetable"
import { MobileEntityListItem } from "@/components/shared/MobileEntityListItem"
import {
  SectionCard,
  EmptyState,
  InitialsAvatar,
  StatusPill,
} from "@/components/admin/students/tabs/_primitives"
import { deriveTeachers } from "./class-helpers"

interface TeachersTabProps {
  classId: number
}

function splitName(fullName: string): { first?: string; last?: string } {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return { first: parts[0] }
  return { last: parts[0], first: parts.slice(1).join(" ") }
}

export function TeachersTab({ classId }: TeachersTabProps) {
  const { data, isLoading, isError, error, refetch } = useTimetable(classId)
  const teachers = deriveTeachers(data ?? [])

  return (
    <SectionCard
      icon={<GraduationCap className="h-4 w-4" />}
      title="Enseignants"
      description={isLoading ? undefined : `${teachers.length} enseignant${teachers.length > 1 ? "s" : ""} dans cette classe`}
    >
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <DataError message={error?.message ?? "Erreur de chargement"} error={error} onRetry={refetch} />
      ) : teachers.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="h-5 w-5" />}
          title="Aucun enseignant"
          message="Les enseignants apparaîtront ici dès qu'un emploi du temps sera défini (le lien se fait via les créneaux)."
        />
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden space-y-2 md:block">
            {teachers.map((t) => {
              const { first, last } = splitName(t.teacher_name)
              return (
                <a
                  key={t.teacher_id}
                  href={`/admin/teachers/${t.teacher_id}`}
                  className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/40 p-3 transition-colors hover:bg-accent/40"
                >
                  <InitialsAvatar first={first} last={last} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.teacher_name}</p>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">
                        {t.subject_names.length > 0 ? t.subject_names.join(", ") : "—"}
                      </span>
                    </div>
                  </div>
                  <StatusPill tone="neutral">{t.slot_count} cours</StatusPill>
                </a>
              )
            })}
          </div>

          {/* Mobile */}
          <div className="space-y-2 md:hidden">
            {teachers.map((t) => {
              const { first, last } = splitName(t.teacher_name)
              return (
                <MobileEntityListItem
                  key={t.teacher_id}
                  href={`/admin/teachers/${t.teacher_id}` as Route}
                  avatar={<InitialsAvatar first={first} last={last} size="sm" />}
                  primary={t.teacher_name}
                  secondary={t.subject_names.length > 0 ? t.subject_names.join(", ") : "Aucune matière"}
                  status={<StatusPill tone="neutral">{t.slot_count}</StatusPill>}
                />
              )
            })}
          </div>
        </>
      )}
    </SectionCard>
  )
}
