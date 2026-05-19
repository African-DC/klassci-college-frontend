"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react"
import type { TeacherAttendanceStats } from "@/lib/contracts/teacher-attendance"
import { TONE_CLASSES, formatLateMinutes } from "./teacher-attendance-helpers"

interface AttendanceStatsHeroProps {
  stats: TeacherAttendanceStats | undefined
  isLoading: boolean
}

export function AttendanceStatsHero({ stats, isLoading }: AttendanceStatsHeroProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          Statistiques indisponibles.
        </CardContent>
      </Card>
    )
  }

  const rate = Math.round(stats.attendance_rate)
  const totalAbsences =
    stats.sessions_absent_excused + stats.sessions_absent_unexcused
  const totalSessions =
    stats.total_sessions ||
    stats.sessions_present + totalAbsences + stats.sessions_late
  const unexcusedPlural = stats.sessions_absent_unexcused > 1 ? "s" : ""
  const hasPending = stats.pending_validation_count > 0

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi
          label="Taux de présence"
          value={`${rate}%`}
          tone="emerald"
          icon={<CheckCircle2 className="h-4 w-4" />}
          subtext={`${stats.sessions_present} / ${totalSessions} créneaux`}
        />
        <Kpi
          label="Absences"
          value={String(totalAbsences)}
          tone="rose"
          icon={<XCircle className="h-4 w-4" />}
          subtext={`${stats.sessions_absent_unexcused} non justifiée${unexcusedPlural}`}
        />
        <Kpi
          label="Retards"
          value={String(stats.sessions_late)}
          tone="blue"
          icon={<Clock className="h-4 w-4" />}
          subtext={
            stats.total_late_minutes > 0
              ? `${formatLateMinutes(stats.total_late_minutes)} cumulés`
              : "Aucun retard cumulé"
          }
        />
        <Kpi
          label="En attente"
          value={String(stats.pending_validation_count)}
          tone={hasPending ? "amber" : "neutral"}
          icon={<AlertTriangle className="h-4 w-4" />}
          subtext={hasPending ? "À valider" : "Aucune en attente"}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Année {stats.academic_year_name}
      </p>
    </div>
  )
}

interface KpiProps {
  label: string
  value: string
  tone: "emerald" | "rose" | "blue" | "amber" | "neutral"
  icon: React.ReactNode
  subtext: string
}

function Kpi({ label, value, tone, icon, subtext }: KpiProps) {
  const c = TONE_CLASSES[tone]
  return (
    <Card className={`${c.bg} ring-1 ${c.ring} border-0`}>
      <CardContent className="p-3.5">
        <div
          className={`flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide ${c.text}`}
        >
          {icon}
          {label}
        </div>
        <p className={`mt-1.5 text-2xl font-semibold ${c.text}`}>{value}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{subtext}</p>
      </CardContent>
    </Card>
  )
}
