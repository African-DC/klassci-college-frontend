"use client"

import {
  GraduationCap,
  CalendarDays,
  ClipboardCheck,
  BookOpen,
  User,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { CircularProgress } from "@/components/shared/CircularProgress"

interface OverviewTabProps {
  student: {
    first_name: string
    last_name: string
    genre?: string | null
    enrollment_number?: string | null
  }
  fullData?: {
    current_class_name?: string | null
    current_academic_year?: string | null
    current_enrollment_status?: string | null
    average_grade?: number | null // sur 20
    attendance_rate?: number | null // 0-100
    fees_rate?: number | null // 0-100
    subjects_count?: number | null
  } | null
}

function gradeToPercent(grade: number | null | undefined): number {
  if (grade == null) return 0
  return Math.round((grade / 20) * 100)
}

function formatGrade(grade: number | null | undefined): string {
  if (grade == null) return "N/A"
  return `${grade.toFixed(1)}/20`
}

function formatPercent(value: number | null | undefined): string {
  if (value == null) return "N/A"
  return `${Math.round(value)}%`
}

const STATUS_LABELS: Record<string, string> = {
  valide: "Valid\u00e9",
  en_validation: "En validation",
  prospect: "Prospect",
  rejete: "Rejet\u00e9",
  annule: "Annul\u00e9",
}

export function OverviewTab({ student, fullData }: OverviewTabProps) {
  const gradePercent = gradeToPercent(fullData?.average_grade)
  const attendanceRate = fullData?.attendance_rate ?? 0
  const feesRate = fullData?.fees_rate ?? 0
  const subjectsCount = fullData?.subjects_count ?? 0

  return (
    <div className="space-y-4">
      {/* KPI row with CircularProgress */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="p-4">
            <CircularProgress
              value={gradePercent}
              label={formatGrade(fullData?.average_grade)}
              sublabel="Moyenne g\u00e9n\u00e9rale"
              icon={<BookOpen className="h-4 w-4 text-muted-foreground/60" />}
            />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="p-4">
            <CircularProgress
              value={attendanceRate}
              label={formatPercent(fullData?.attendance_rate)}
              sublabel="Taux de pr\u00e9sence"
              icon={<ClipboardCheck className="h-4 w-4 text-muted-foreground/60" />}
            />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="p-4">
            <CircularProgress
              value={feesRate}
              label={formatPercent(fullData?.fees_rate)}
              sublabel="Paiements"
              color={feesRate >= 100 ? "#10b981" : feesRate >= 50 ? "#f59e0b" : "#ef4444"}
              icon={<CalendarDays className="h-4 w-4 text-muted-foreground/60" />}
            />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="p-4">
            <CircularProgress
              value={subjectsCount > 0 ? 100 : 0}
              label={`${subjectsCount} mati\u00e8re${subjectsCount > 1 ? "s" : ""}`}
              sublabel="Mati\u00e8res inscrites"
              color="#6366f1"
              icon={<GraduationCap className="h-4 w-4 text-muted-foreground/60" />}
            />
          </CardContent>
        </Card>
      </div>

      {/* Quick info section */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Informations rapides
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem
              icon={<BookOpen className="h-4 w-4" />}
              label="Matricule"
              value={student.enrollment_number ?? "Non attribu\u00e9"}
              mono
            />
            <InfoItem
              icon={<GraduationCap className="h-4 w-4" />}
              label="Classe"
              value={fullData?.current_class_name ?? "Non inscrit"}
            />
            <InfoItem
              icon={<CalendarDays className="h-4 w-4" />}
              label="Ann\u00e9e scolaire"
              value={fullData?.current_academic_year ?? "\u2014"}
            />
            <InfoItem
              icon={<User className="h-4 w-4" />}
              label="Genre"
              value={
                student.genre === "M"
                  ? "Masculin"
                  : student.genre === "F"
                    ? "F\u00e9minin"
                    : "Non renseign\u00e9"
              }
            />
            <InfoItem
              icon={<ClipboardCheck className="h-4 w-4" />}
              label="Statut"
              value={
                fullData?.current_enrollment_status
                  ? STATUS_LABELS[fullData.current_enrollment_status] ?? fullData.current_enrollment_status
                  : "\u2014"
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function InfoItem({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>
          {value}
        </p>
      </div>
    </div>
  )
}
