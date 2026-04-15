"use client"

import {
  GraduationCap,
  Users,
  Clock,
  CalendarCheck,
  BookOpen,
  Phone,
  Mail,
  User,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CircularProgress } from "@/components/shared/CircularProgress"
import type { Teacher } from "@/lib/contracts/teacher"

interface TeacherOverviewTabProps {
  teacherId: number
  teacher: Teacher
  fullData?: Record<string, unknown>
}

export function TeacherOverviewTab({ teacherId, teacher, fullData }: TeacherOverviewTabProps) {
  const classesCount = (fullData?.classes_count as number) ?? 0
  const studentsCount = (fullData?.students_count as number) ?? 0
  const hoursPerWeek = (fullData?.hours_per_week as number) ?? 0
  const availabilityRate = (fullData?.availability_rate as number) ?? 0

  return (
    <div className="space-y-4">
      {/* KPI row with CircularProgress */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="p-4">
            <CircularProgress
              value={classesCount > 0 ? 100 : 0}
              label={`${classesCount} classe${classesCount > 1 ? "s" : ""}`}
              sublabel="Classes assignées"
              color="#6366f1"
              icon={<GraduationCap className="h-4 w-4 text-muted-foreground/60" />}
            />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="p-4">
            <CircularProgress
              value={studentsCount > 0 ? 100 : 0}
              label={`${studentsCount} élève${studentsCount > 1 ? "s" : ""}`}
              sublabel="Élèves total"
              color="#6366f1"
              icon={<Users className="h-4 w-4 text-muted-foreground/60" />}
            />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="p-4">
            <CircularProgress
              value={hoursPerWeek > 0 ? Math.min((hoursPerWeek / 30) * 100, 100) : 0}
              label={`${hoursPerWeek}h`}
              sublabel="Heures/semaine"
              color={hoursPerWeek > 25 ? "#ef4444" : hoursPerWeek > 15 ? "#f59e0b" : "#10b981"}
              icon={<Clock className="h-4 w-4 text-muted-foreground/60" />}
            />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="p-4">
            <CircularProgress
              value={availabilityRate}
              label={`${Math.round(availabilityRate)}%`}
              sublabel="Disponibilité"
              icon={<CalendarCheck className="h-4 w-4 text-muted-foreground/60" />}
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
              label="Spécialité"
              value={teacher.speciality ?? "Non renseignée"}
            />
            <InfoItem
              icon={<Phone className="h-4 w-4" />}
              label="Téléphone"
              value={teacher.phone ?? "Non renseigné"}
            />
            <InfoItem
              icon={<Mail className="h-4 w-4" />}
              label="Email"
              value={(fullData?.user_email as string) ?? "Non renseigné"}
            />
            <InfoItem
              icon={<User className="h-4 w-4" />}
              label="Statut"
              value={(fullData?.user_is_active as boolean) !== false ? "Actif" : "Inactif"}
              badge={(fullData?.user_is_active as boolean) !== false ? "success" : "destructive"}
            />
            <InfoItem
              icon={<CalendarCheck className="h-4 w-4" />}
              label="Créé le"
              value={
                teacher.created_at
                  ? new Date(teacher.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "—"
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
  badge,
}: {
  icon: React.ReactNode
  label: string
  value: string
  mono?: boolean
  badge?: "success" | "destructive"
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {badge ? (
          <Badge variant={badge === "success" ? "outline" : "destructive"} className={`text-xs ${badge === "success" ? "border-emerald-500 text-emerald-600" : ""}`}>
            {value}
          </Badge>
        ) : (
          <p className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>
            {value}
          </p>
        )}
      </div>
    </div>
  )
}
