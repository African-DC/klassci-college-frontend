"use client"

import { ClipboardCheck, CheckCircle2, XCircle, AlertCircle, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataError } from "@/components/shared/DataError"
import { useStudentAttendance } from "@/lib/hooks/useAttendance"
import { SectionCard, StatusPill, EmptyState } from "./_primitives"

interface AttendanceTabProps {
  studentId: number
}

function statusTone(s: string): "success" | "danger" | "warning" | "neutral" {
  if (s === "present") return "success"
  if (s === "absent") return "danger"
  if (s === "late") return "warning"
  return "neutral"
}

function statusLabel(s: string): string {
  if (s === "present") return "Présent"
  if (s === "absent") return "Absent"
  if (s === "late") return "En retard"
  if (s === "excused") return "Excusé"
  return s
}

export function AttendanceTab({ studentId }: AttendanceTabProps) {
  const { data, isLoading, isError, refetch } = useStudentAttendance(studentId)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (isError) return <DataError message="Impossible de charger les présences." onRetry={() => refetch()} />

  const records = data?.items ?? []
  const counts = records.reduce(
    (acc, r) => {
      if (r.status === "present") acc.present++
      else if (r.status === "absent") acc.absent++
      else if (r.status === "late") acc.late++
      else if (r.status === "excused") acc.excused++
      return acc
    },
    { present: 0, absent: 0, late: 0, excused: 0 },
  )

  const total = counts.present + counts.absent + counts.late + counts.excused
  const rate = total > 0 ? Math.round((counts.present / total) * 100) : 0

  if (records.length === 0) {
    return (
      <SectionCard
        icon={<ClipboardCheck className="h-4 w-4" />}
        title="Présences"
        description="Suivi de l'assiduité de l'élève"
      >
        <EmptyState
          icon={<Calendar className="h-5 w-5" />}
          title="Aucun enregistrement de présence"
          message="Les présences s'afficheront ici dès la première séance enregistrée par l'enseignant."
        />
      </SectionCard>
    )
  }

  return (
    <div className="space-y-4">
      {/* KPI grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Taux d'assiduité — gros KPI */}
        <Card className="border-0 shadow-sm ring-1 ring-border lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke={rate >= 90 ? "#10b981" : rate >= 75 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="3"
                    strokeDasharray={`${(rate / 100) * 94.25} 94.25`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="font-mono text-xs font-bold">{rate}%</span>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Assiduité</p>
                <p className="mt-0.5 text-sm font-semibold">
                  {rate >= 90 ? "Excellente" : rate >= 75 ? "Correcte" : "À surveiller"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <KpiCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Présents"
          value={counts.present}
          tone="success"
        />
        <KpiCard
          icon={<XCircle className="h-5 w-5" />}
          label="Absences"
          value={counts.absent}
          tone="danger"
        />
        <KpiCard
          icon={<AlertCircle className="h-5 w-5" />}
          label="Retards"
          value={counts.late}
          tone="warning"
        />
      </div>

      {/* Recent records table */}
      <SectionCard
        icon={<Calendar className="h-4 w-4" />}
        title="Historique des présences"
        description={`${total} enregistrement${total > 1 ? "s" : ""} au total`}
      >
        <div className="overflow-hidden rounded-lg border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase tracking-wide">Date</TableHead>
                <TableHead className="text-xs uppercase tracking-wide">Statut</TableHead>
                <TableHead className="text-xs uppercase tracking-wide">Heure</TableHead>
                <TableHead className="text-xs uppercase tracking-wide">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => {
                const tone = statusTone(record.status)
                const label = statusLabel(record.status)
                return (
                  <TableRow key={record.id}>
                    <TableCell className="text-sm">
                      {new Date(record.created_at).toLocaleDateString("fr-FR", {
                        weekday: "short",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <StatusPill tone={tone}>{label}</StatusPill>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {record.time_in ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {record.notes ?? "—"}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </div>
  )
}

function KpiCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: number
  tone: "success" | "danger" | "warning"
}) {
  const styles = {
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    danger: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  }
  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${styles[tone]}`}>
            {icon}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="font-mono text-xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
