"use client"

import { BookOpen, DoorOpen, GraduationCap, School, Users } from "lucide-react"
import type { Class } from "@/lib/contracts/class"
import type { TimetableSlot } from "@/lib/contracts/timetable"
import { SectionCard } from "@/components/admin/students/tabs/_primitives"
import { deriveSubjects, deriveTeachers } from "./class-helpers"
import { ClassDocumentsSection } from "./ClassDocumentsSection"

interface OverviewTabProps {
  classData: Class
  slots: TimetableSlot[]
}

function MetricTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Users
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="mt-1 text-2xl font-bold leading-none tracking-tight tabular-nums">
        {value}
      </div>
      {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  )
}

export function OverviewTab({ classData, slots }: OverviewTabProps) {
  const enrolled = classData.enrolled_count ?? 0
  const max = classData.max_students ?? 0
  const ratio = max > 0 ? Math.round((enrolled / max) * 100) : 0
  const available = max > 0 ? Math.max(max - enrolled, 0) : 0

  const subjectsCount = deriveSubjects(slots).length
  const teachersCount = deriveTeachers(slots).length
  const academicYearId = slots[0]?.academic_year_id

  const name = classData.name
  const barTone =
    ratio > 95 ? "bg-rose-500" : ratio >= 80 ? "bg-amber-500" : "bg-emerald-500"

  return (
    <div className="space-y-5">
      <SectionCard icon={<School className="h-4 w-4" />} title="Synthèse de la classe">
        {/* Capacité avec barre de remplissage */}
        <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Effectif inscrit
              </p>
              <p className="mt-1 text-3xl font-bold leading-none tracking-tight tabular-nums">
                {enrolled}
                <span className="ml-1 text-base font-medium text-muted-foreground">
                  / {max || "—"}
                </span>
              </p>
            </div>
            <span className="text-2xl font-bold tabular-nums text-[#F58220]">{ratio}%</span>
          </div>
          {max > 0 && (
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${barTone}`}
                style={{ width: `${Math.min(ratio, 100)}%` }}
                role="progressbar"
                aria-valuenow={ratio}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Taux de remplissage : ${ratio}%`}
              />
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            {max > 0 ? `${available} place${available > 1 ? "s" : ""} disponible${available > 1 ? "s" : ""}` : "Capacité non définie"}
          </p>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile
            icon={GraduationCap}
            label="Niveau"
            value={classData.level_name ?? "—"}
            hint={classData.series_name ? `Série ${classData.series_name}` : undefined}
          />
          <MetricTile
            icon={DoorOpen}
            label="Salle"
            value={classData.room_id ? `Salle ${name}` : "—"}
            hint={classData.room_id ? "Salle attitrée" : "Aucune salle"}
          />
          <MetricTile
            icon={BookOpen}
            label="Matières"
            value={subjectsCount}
            hint="enseignées (via l'EDT)"
          />
          <MetricTile
            icon={Users}
            label="Enseignants"
            value={teachersCount}
            hint="intervenant dans la classe"
          />
        </div>
      </SectionCard>

      <ClassDocumentsSection classId={classData.id} name={name} academicYearId={academicYearId} />
    </div>
  )
}
