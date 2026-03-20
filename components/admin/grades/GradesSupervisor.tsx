"use client"

import { useState } from "react"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEvaluations } from "@/lib/hooks/useGrades"
import type { Evaluation } from "@/lib/contracts/grade"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const TYPE_LABELS: Record<string, string> = {
  devoir: "Devoir",
  interro: "Interrogation",
  examen: "Examen",
  composition: "Composition",
}

function isOverdue(evaluation: Evaluation): boolean {
  const daysAgo = (Date.now() - new Date(evaluation.date).getTime()) / (1000 * 60 * 60 * 24)
  return daysAgo > 3 && evaluation.graded_students < evaluation.total_students
}

interface GradesSupervisorProps {
  defaultClassId?: number
}

export function GradesSupervisor({ defaultClassId }: GradesSupervisorProps) {
  const [classId, setClassId] = useState(defaultClassId ?? 0)
  const { data: evaluations, isLoading, error } = useEvaluations(classId)

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          Classe :
        </label>
        <Input
          type="number"
          placeholder="ID classe"
          className="h-9 w-32"
          value={classId || ""}
          onChange={(e) => setClassId(e.target.value ? Number(e.target.value) : 0)}
        />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Evaluation</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Matiere</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Coeff.</TableHead>
              <TableHead>Progression</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !evaluations?.length ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  {classId ? "Aucune evaluation trouvee" : "Selectionnez une classe"}
                </TableCell>
              </TableRow>
            ) : (
              evaluations.map((evaluation) => {
                const overdue = isOverdue(evaluation)
                const complete = evaluation.graded_students === evaluation.total_students
                return (
                  <TableRow key={evaluation.id} className={cn(overdue && "bg-destructive/5")}>
                    <TableCell className="font-medium">{evaluation.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {TYPE_LABELS[evaluation.type] ?? evaluation.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{evaluation.subject_name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(evaluation.date).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-center">{evaluation.coefficient}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              complete ? "bg-emerald-500" : "bg-primary"
                            )}
                            style={{
                              width: `${evaluation.total_students > 0
                                ? (evaluation.graded_students / evaluation.total_students) * 100
                                : 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {evaluation.graded_students}/{evaluation.total_students}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {overdue ? (
                        <Badge variant="destructive" className="gap-1 text-xs">
                          <AlertCircle className="h-3 w-3" />
                          En retard
                        </Badge>
                      ) : complete ? (
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-xs">
                          Complet
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          En cours
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
