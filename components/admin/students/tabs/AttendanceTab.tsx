"use client"

import { ClipboardCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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

interface AttendanceTabProps {
  studentId: number
}

const ATTENDANCE_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  present: { label: "Present", variant: "default", className: "bg-emerald-600 hover:bg-emerald-600/80" },
  absent: { label: "Absent", variant: "destructive" },
  late: { label: "En retard", variant: "secondary", className: "bg-amber-500 text-white hover:bg-amber-500/80" },
  excused: { label: "Excuse", variant: "outline" },
}

function getAttendanceConfig(status: string) {
  return ATTENDANCE_STATUS[status] ?? { label: status, variant: "outline" as const }
}

export function AttendanceTab({ studentId }: AttendanceTabProps) {
  const { data, isLoading, isError, refetch } = useStudentAttendance(studentId)

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
        <Skeleton className="h-48 rounded-lg" />
      </div>
    )
  }

  if (isError) return <DataError message="Impossible de charger les presences." onRetry={() => refetch()} />

  const records = data?.items ?? []

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted mb-3">
          <ClipboardCheck className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Aucun enregistrement de presence.</p>
      </div>
    )
  }

  // Summary counts
  const counts = records.reduce(
    (acc, r) => {
      if (r.status === "present") acc.present++
      else if (r.status === "absent") acc.absent++
      else if (r.status === "late") acc.late++
      return acc
    },
    { present: 0, absent: 0, late: 0 },
  )

  return (
    <div className="space-y-4">
      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="p-3 text-center">
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{counts.present}</p>
            <p className="text-[10px] text-muted-foreground">Present</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="p-3 text-center">
            <p className="text-sm font-bold text-destructive">{counts.absent}</p>
            <p className="text-[10px] text-muted-foreground">Absent</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="p-3 text-center">
            <p className="text-sm font-bold text-amber-500">{counts.late}</p>
            <p className="text-[10px] text-muted-foreground">En retard</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent records table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Heure d&apos;arrivee</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => {
              const config = getAttendanceConfig(record.status)
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
                    <Badge variant={config.variant} className={`text-[10px] ${config.className ?? ""}`}>
                      {config.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {record.time_in ?? "\u2014"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {record.notes ?? "\u2014"}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
