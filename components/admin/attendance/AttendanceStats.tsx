"use client"

import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAttendanceStats } from "@/lib/hooks/useAttendance"

interface AttendanceStatsProps {
  classId?: number
}

function rateColor(rate: number): string {
  if (rate >= 90) return "text-emerald-600 dark:text-emerald-400"
  if (rate >= 75) return "text-amber-600 dark:text-amber-400"
  return "text-destructive"
}


export function AttendanceStats({ classId }: AttendanceStatsProps) {
  const { data: stats, isLoading } = useAttendanceStats(classId)

  if (!classId) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Sélectionnez une classe pour afficher les statistiques de présence.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    )
  }

  if (!stats || stats.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Aucune statistique disponible pour cette classe.
      </div>
    )
  }

  // Tri par taux de présence (plus faible en premier pour alerter)
  const sorted = [...stats].sort((a, b) => a.rate - b.rate)

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Élève</TableHead>
            <TableHead className="text-center">Sessions</TableHead>
            <TableHead className="text-center">Présent</TableHead>
            <TableHead className="text-center">Absent</TableHead>
            <TableHead className="text-center">Retard</TableHead>
            <TableHead className="text-center">Excusé</TableHead>
            <TableHead className="text-center">Taux</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((s) => (
            <TableRow key={s.student_id}>
              <TableCell className="font-medium">{s.student_name}</TableCell>
              <TableCell className="text-center">{s.total_sessions}</TableCell>
              <TableCell className="text-center text-emerald-600 dark:text-emerald-400 font-medium">{s.present}</TableCell>
              <TableCell className="text-center text-destructive font-medium">{s.absent}</TableCell>
              <TableCell className="text-center text-amber-600 dark:text-amber-400">{s.late}</TableCell>
              <TableCell className="text-center text-blue-600 dark:text-blue-400">{s.excused}</TableCell>
              <TableCell className="text-center">
                <span className={`text-sm font-semibold ${rateColor(s.rate)}`}>
                  {s.rate.toFixed(1)}%
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
