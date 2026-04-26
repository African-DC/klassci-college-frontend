"use client"

import { useState } from "react"
import { ClipboardCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataError } from "@/components/shared/DataError"
import { useTeacherClasses, useTeacherClassAttendance } from "@/lib/hooks/useTeacherPortal"

export function TeacherAttendanceClient() {
  const [selectedClassId, setSelectedClassId] = useState<number | undefined>()
  const { data: classes, isLoading: loadingClasses } = useTeacherClasses()
  const { data: stats, isLoading: loadingStats, error } = useTeacherClassAttendance(selectedClassId)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <ClipboardCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-serif text-2xl tracking-tight">Présences</h1>
          <p className="text-sm text-muted-foreground">Suivi des présences par classe</p>
        </div>
      </div>

      {/* Sélection de classe */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium">Sélectionner une classe</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingClasses ? (
            <Skeleton className="h-10 w-64" />
          ) : (
            <Select
              value={selectedClassId?.toString() ?? ""}
              onValueChange={(v) => setSelectedClassId(Number(v))}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Choisir une classe" />
              </SelectTrigger>
              <SelectContent>
                {classes?.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name} — {c.subject_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Stats de présence */}
      {selectedClassId && (
        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">Statistiques de présence</CardTitle>
            {stats && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">{stats.total_sessions} sessions</span>
                <Badge variant={stats.attendance_rate >= 90 ? "default" : stats.attendance_rate >= 75 ? "secondary" : "destructive"}>
                  {stats.attendance_rate.toFixed(1)}%
                </Badge>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {error ? (
              <DataError message="Impossible de charger les présences." />
            ) : loadingStats ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : stats && stats.students.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Élève</TableHead>
                    <TableHead className="text-center">Présent</TableHead>
                    <TableHead className="text-center">Absent</TableHead>
                    <TableHead className="text-center">Retard</TableHead>
                    <TableHead className="text-center">Excusé</TableHead>
                    <TableHead className="text-right">Taux</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.students.map((s) => (
                    <TableRow key={s.student_id}>
                      <TableCell className="font-medium">{s.last_name} {s.first_name}</TableCell>
                      <TableCell className="text-center">{s.present_count}</TableCell>
                      <TableCell className="text-center">{s.absent_count}</TableCell>
                      <TableCell className="text-center">{s.late_count}</TableCell>
                      <TableCell className="text-center">{s.excused_count}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={s.attendance_rate >= 90 ? "default" : s.attendance_rate >= 75 ? "secondary" : "destructive"}>
                          {s.attendance_rate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aucune session de présence enregistrée pour cette classe.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
