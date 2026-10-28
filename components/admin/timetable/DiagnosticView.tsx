"use client"

import { AlertTriangle, BookOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { TimetableDiagnostic } from "@/lib/contracts/timetable"

interface DiagnosticViewProps {
  diagnostic: TimetableDiagnostic
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  )
}

/** Résumé d'une génération : volumes, matières prêtes et matières sans enseignant. */
export function DiagnosticView({ diagnostic }: DiagnosticViewProps) {
  const missingCount = diagnostic.subjects_without_teacher.length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 text-center">
        <Stat value={`${diagnostic.total_hours_required}h`} label="Heures requises" />
        <Stat value={diagnostic.manual_slots_count} label="Manuels (préservés)" />
        <Stat value={diagnostic.subjects_with_teacher.length + missingCount} label="Matières" />
      </div>

      {diagnostic.subjects_with_teacher.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Matières prêtes
          </p>
          <div className="space-y-1.5">
            {diagnostic.subjects_with_teacher.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                  <span className="truncate text-sm font-medium">{s.name}</span>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">{s.hours_per_week}h/sem</Badge>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{s.teacher_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {missingCount > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
            Matières sans enseignant ({missingCount})
          </p>
          <div className="space-y-1.5">
            {diagnostic.subjects_without_teacher.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2 dark:border-amber-900 dark:bg-amber-950/30"
              >
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{s.name}</span>
                <Badge variant="secondary" className="shrink-0 text-[10px]">{s.hours_per_week}h</Badge>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Choisissez l&apos;enseignant de chaque matière avant de générer l&apos;emploi du temps.
          </p>
        </div>
      )}
    </div>
  )
}
