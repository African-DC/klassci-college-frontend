"use client"

import { useState } from "react"
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
import { useStudentGrades } from "@/lib/hooks/useStudentPortal"
import { DataError } from "@/components/shared/DataError"
import type { StudentSubjectGrades } from "@/lib/contracts/student-portal"

const TYPE_LABELS: Record<string, string> = {
  devoir: "Devoir",
  interro: "Interro",
  examen: "Examen",
  composition: "Compo",
}

function averageColor(avg: number | null): string {
  if (avg === null) return "text-muted-foreground"
  if (avg >= 14) return "text-emerald-600 dark:text-emerald-400"
  if (avg >= 10) return "text-primary"
  return "text-destructive"
}

export function StudentGradesClient() {
  const [trimester, setTrimester] = useState<string | undefined>(undefined)
  const { data, isLoading, isError, refetch } = useStudentGrades(trimester)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl tracking-tight">Mes notes</h1>
        <p className="text-sm text-muted-foreground">Résultats par matière et trimestre</p>
      </div>

      {/* Filtre trimestre */}
      <div className="flex items-center gap-3">
        <Select
          value={trimester ?? "all"}
          onValueChange={(v) => setTrimester(v === "all" ? undefined : v)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Trimestre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les trimestres</SelectItem>
            <SelectItem value="1">1er trimestre</SelectItem>
            <SelectItem value="2">2ème trimestre</SelectItem>
            <SelectItem value="3">3ème trimestre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <GradesSkeleton />
      ) : isError ? (
        <DataError message="Impossible de charger les notes." onRetry={() => refetch()} />
      ) : !data ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Aucune note disponible.
        </div>
      ) : (
        <>
          {/* Résumé général */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-medium text-primary uppercase tracking-wider">Moyenne générale</p>
                <p className={`text-2xl font-bold mt-1 ${averageColor(data.general_average)}`}>
                  {data.general_average !== null ? `${data.general_average.toFixed(2)}/20` : "—"}
                </p>
              </div>
              {data.rank !== null && (
                <Badge variant="secondary" className="text-sm">
                  {data.rank}/{data.total_students}
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Notes par matière */}
          {data.subjects.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Aucune note pour ce trimestre.
            </div>
          ) : (
            <div className="space-y-4">
              {data.subjects.map((subject) => (
                <SubjectCard key={subject.subject_id} subject={subject} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function SubjectCard({ subject }: { subject: StudentSubjectGrades }) {
  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{subject.subject_name}</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Coef. {subject.coefficient}</span>
            <Badge
              variant="secondary"
              className={averageColor(subject.average)}
            >
              {subject.average !== null ? `${subject.average.toFixed(2)}` : "—"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {subject.grades.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">Aucune note</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Évaluation</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs text-right">Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subject.grades.map((grade) => (
                <TableRow key={grade.id}>
                  <TableCell className="text-xs py-2">
                    <span className="font-medium">{grade.title}</span>
                    <span className="text-muted-foreground ml-1 text-[10px]">
                      ({new Date(grade.date).toLocaleDateString("fr-FR")})
                    </span>
                  </TableCell>
                  <TableCell className="text-xs py-2">
                    <Badge variant="outline" className="text-[10px]">
                      {TYPE_LABELS[grade.type] ?? grade.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right py-2">
                    {grade.value !== null ? (
                      <span className={`text-sm font-semibold ${grade.value >= 10 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                        {grade.value}/{grade.out_of}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function GradesSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 rounded-lg" />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-lg" />
      ))}
    </div>
  )
}
