"use client"

import { enrollmentStatusView } from "@/lib/enrollment/status"
import {
  GraduationCap,
  CalendarDays,
  FileText,
  ClipboardCheck,
  Landmark,
  User,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { AssignmentStatusBadge } from "@/components/shared/AssignmentStatusBadge"
import type { Enrollment } from "@/lib/contracts/enrollment"

interface EnrollmentOverviewTabProps {
  enrollment: Enrollment
}

export function EnrollmentOverviewTab({ enrollment }: EnrollmentOverviewTabProps) {
  const status = enrollmentStatusView(enrollment.status)

  const studentName = [enrollment.student_first_name, enrollment.student_last_name]
    .filter(Boolean)
    .join(" ") || "Non renseigné"

  const className = enrollment.class_name ?? "Non renseigné"
  const academicYear = enrollment.academic_year_name ?? "Non renseigné"

  const createdAt = enrollment.created_at
    ? new Date(enrollment.created_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Non renseigné"

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Élève</p>
                <p className="text-sm font-semibold">{studentName}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Classe</p>
                <p className="text-sm font-semibold">{className}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Année scolaire</p>
                <p className="text-sm font-semibold">{academicYear}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail card */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Détails de l&apos;inscription
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <ClipboardCheck className="h-3.5 w-3.5" />
                Statut
              </p>
              <div>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
            </div>

            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Landmark className="h-3.5 w-3.5" />
                Affectation
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <AssignmentStatusBadge status={enrollment.assignment_status} />
                {/* Le numéro de décision ne vaut que pour un élève pris en
                    charge par l'État : on ne l'affiche que s'il existe. */}
                {enrollment.assignment_decision_number ? (
                  <span className="text-sm font-medium tabular-nums">
                    {enrollment.assignment_decision_number}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                Notes
              </p>
              <p className="text-sm font-medium">
                {enrollment.notes ?? "Aucune note"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                Date d&apos;inscription
              </p>
              <p className="text-sm font-medium">{createdAt}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
