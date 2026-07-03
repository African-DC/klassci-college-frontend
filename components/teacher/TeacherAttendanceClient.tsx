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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataError } from "@/components/shared/DataError"
import { AppelSheet } from "@/components/teacher/AppelSheet"
import { useTeacherClasses, useTeacherClassAttendance } from "@/lib/hooks/useTeacherPortal"

export function TeacherAttendanceClient() {
  const [selectedClassId, setSelectedClassId] = useState<number | undefined>()
  const { data: classes, isLoading: loadingClasses } = useTeacherClasses()
  const { data: stats, isLoading: loadingStats, error } = useTeacherClassAttendance(selectedClassId)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <ClipboardCheck aria-hidden="true" className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-serif text-2xl tracking-tight">Présences</h1>
          <p className="text-sm text-muted-foreground">Suivi des présences par classe</p>
        </div>
      </div>

      <Tabs defaultValue="appel" className="space-y-4">
        <TabsList>
          <TabsTrigger value="appel">Faire l&apos;appel</TabsTrigger>
          <TabsTrigger value="stats">Statistiques</TabsTrigger>
        </TabsList>

        <TabsContent value="appel">
          <AppelSheet />
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
      {/* Sélection de classe */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium">Sélectionner une classe</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingClasses ? (
            <Skeleton className="h-11 w-full sm:w-64" />
          ) : (
            <Select
              value={selectedClassId?.toString() ?? ""}
              onValueChange={(v) => setSelectedClassId(Number(v))}
            >
              <SelectTrigger className="h-11 w-full sm:h-10 sm:w-64" aria-label="Choisir une classe">
                <SelectValue placeholder="Choisir une classe" />
              </SelectTrigger>
              <SelectContent>
                {classes?.map((c) => (
                  <SelectItem key={c.class_id} value={c.class_id.toString()}>
                    {c.class_name} — {c.subject_name}
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
              <>
              {/* Desktop : table dense 6 colonnes (Élève / 4 compteurs / Taux). */}
              <div className="hidden md:block">
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
              </div>

              {/* Mobile : cards par élève avec taux prominent, compteurs en
                  ligne secondaire. Plus lisible que la table 6 colonnes
                  qui se compresse sous 320px (rule UX target user Itel S661). */}
              <div className="space-y-2 md:hidden">
                {stats.students.map((s) => (
                  <div key={s.student_id} className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{s.last_name} {s.first_name}</p>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground tabular-nums">
                        <span>✓ {s.present_count}</span>
                        <span className="text-rose-600">✗ {s.absent_count}</span>
                        <span className="text-amber-600">↻ {s.late_count}</span>
                        <span>– {s.excused_count}</span>
                      </div>
                    </div>
                    <Badge
                      variant={s.attendance_rate >= 90 ? "default" : s.attendance_rate >= 75 ? "secondary" : "destructive"}
                      className="shrink-0 tabular-nums"
                    >
                      {s.attendance_rate.toFixed(1)}%
                    </Badge>
                  </div>
                ))}
              </div>
              </>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aucune session de présence enregistrée pour cette classe.
              </p>
            )}
          </CardContent>
        </Card>
      )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
