"use client"

import { FileText, BookOpen, GraduationCap, CalendarDays } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useTeacherEvaluations } from "@/lib/hooks/useGrades"

const TYPE_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  controle: { label: "Contrôle", variant: "secondary" },
  devoir: { label: "Devoir", variant: "default" },
  examen: { label: "Examen", variant: "outline" },
  oral: { label: "Oral", variant: "secondary" },
}

interface TeacherEvaluationsTabProps {
  teacherId: number
}

export function TeacherEvaluationsTab({ teacherId }: TeacherEvaluationsTabProps) {
  const { data: evaluations, isLoading } = useTeacherEvaluations(teacherId)

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (!evaluations || evaluations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted mb-3">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Aucune évaluation créée par cet enseignant.
        </p>
      </div>
    )
  }

  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead>Matière</TableHead>
              <TableHead>Classe</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Notes saisies</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {evaluations.map((ev) => {
              const typeConf = TYPE_CONFIG[ev.type] ?? { label: ev.type, variant: "outline" as const }
              const dateStr = ev.date
                ? new Date(ev.date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "—"

              return (
                <TableRow key={ev.id}>
                  <TableCell className="font-medium">{ev.title}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                      {ev.subject_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                      {ev.class_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={typeConf.variant}>{typeConf.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {dateStr}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm">
                      {ev.graded_students}/{ev.total_students}
                    </span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
