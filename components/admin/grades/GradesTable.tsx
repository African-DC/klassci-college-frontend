"use client"

import Link from "next/link"
import type { Route } from "next"
import { AlertTriangle, CheckCircle2, ClipboardList, Edit3, Hourglass } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Evaluation } from "@/lib/contracts/grade"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TYPE_LABELS, isDone, isOverdue } from "./grades-helpers"

interface GradesTableProps {
  evaluations: Evaluation[]
  isLoading: boolean
  noClassSelected: boolean
  classId: number | null
}

export function GradesTable({
  evaluations,
  isLoading,
  noClassSelected,
  classId,
}: GradesTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Évaluation</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Matière</TableHead>
            <TableHead className="hidden md:table-cell">Date</TableHead>
            <TableHead className="hidden text-center lg:table-cell">Coeff.</TableHead>
            <TableHead>Progression</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {noClassSelected ? (
            <TableRow>
              <TableCell colSpan={8} className="h-32 text-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ClipboardList className="h-8 w-8 opacity-40" />
                  <p className="text-sm">Choisissez une classe pour afficher ses évaluations</p>
                </div>
              </TableCell>
            </TableRow>
          ) : isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 8 }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : evaluations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">
                Aucune évaluation ne correspond aux filtres.
              </TableCell>
            </TableRow>
          ) : (
            evaluations.map((evaluation) => {
              const overdue = isOverdue(evaluation)
              const complete = isDone(evaluation)
              const progressPct =
                evaluation.total_students > 0
                  ? (evaluation.graded_students / evaluation.total_students) * 100
                  : 0
              return (
                <TableRow key={evaluation.id} className={cn(overdue && "bg-destructive/5")}>
                  <TableCell className="font-medium">{evaluation.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] uppercase">
                      {TYPE_LABELS[evaluation.type] ?? evaluation.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{evaluation.subject_name}</TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {new Date(evaluation.date).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                    })}
                  </TableCell>
                  <TableCell className="hidden text-center text-sm tabular-nums lg:table-cell">
                    {evaluation.coefficient}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            complete
                              ? "bg-emerald-500"
                              : overdue
                                ? "bg-destructive"
                                : "bg-primary",
                          )}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {evaluation.graded_students}/{evaluation.total_students}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {overdue ? (
                      <Badge variant="destructive" className="gap-1 text-[10px]">
                        <AlertTriangle className="h-3 w-3" />
                        En retard
                      </Badge>
                    ) : complete ? (
                      <Badge className="gap-1 bg-emerald-100 text-[10px] text-emerald-800 hover:bg-emerald-100">
                        <CheckCircle2 className="h-3 w-3" />
                        Complète
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-[10px]">
                        <Hourglass className="h-3 w-3" />
                        En cours
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      asChild
                      size="sm"
                      variant={complete ? "outline" : "default"}
                      className="h-8"
                    >
                      <Link href={`/admin/grades/${evaluation.id}?classId=${classId}` as Route}>
                        <Edit3 className="mr-1 h-3 w-3" />
                        {complete ? "Réviser" : "Saisir"}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
