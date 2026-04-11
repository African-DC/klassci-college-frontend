"use client"

import {
  GraduationCap,
  BookOpen,
  CalendarDays,
  FileText,
  ClipboardCheck,
  User,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { Enrollment } from "@/lib/contracts/enrollment"

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  prospect: { label: "Prospect", variant: "outline" },
  en_validation: { label: "En validation", variant: "secondary" },
  valide: { label: "Valid\u00e9", variant: "default" },
  rejete: { label: "Rejet\u00e9", variant: "destructive" },
  annule: { label: "Annul\u00e9", variant: "destructive" },
}

interface EnrollmentOverviewTabProps {
  enrollment: Enrollment
}

export function EnrollmentOverviewTab({ enrollment }: EnrollmentOverviewTabProps) {
  const e = enrollment as Record<string, unknown>
  const status = statusConfig[enrollment.status] ?? { label: enrollment.status, variant: "outline" as const }

  const studentName = [enrollment.student_first_name, enrollment.student_last_name]
    .filter(Boolean)
    .join(" ") || "Non renseign\u00e9"

  const className = enrollment.class_name ?? "Non renseign\u00e9"
  const academicYear = enrollment.academic_year_name ?? "Non renseign\u00e9"

  const createdAt = enrollment.created_at
    ? new Date(enrollment.created_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Non renseign\u00e9"

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
                <p className="text-xs text-muted-foreground">\u00c9l\u00e8ve</p>
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
                <p className="text-xs text-muted-foreground">Ann\u00e9e scolaire</p>
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
            D\u00e9tails de l&apos;inscription
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
