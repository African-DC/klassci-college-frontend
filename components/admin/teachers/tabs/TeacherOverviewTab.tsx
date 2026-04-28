"use client"

import {
  GraduationCap,
  Users,
  Clock,
  CalendarCheck,
  Phone,
  Mail,
  User,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CircularProgress } from "@/components/shared/CircularProgress"
import type { Teacher } from "@/lib/contracts/teacher"

interface TeacherOverviewTabProps {
  teacherId: number
  teacher: Teacher
  fullData?: Record<string, unknown>
  onTabChange?: (tab: string) => void
}

/**
 * Cycle 2 + 3 sur Vue d'ensemble teacher (PR #151) :
 *  - drop section « Informations rapides » Spécialité (déjà sub-title header)
 *  - KPI cards rendues clickables → switch tab pertinent (Wave-style)
 *  - Téléphone clickable tel: link
 *  - Tri-état badge sémantique sur Statut (En attente si jamais connecté)
 */
export function TeacherOverviewTab({ teacher, fullData, onTabChange }: TeacherOverviewTabProps) {
  const classesCount = (fullData?.classes_count as number) ?? 0
  const studentsCount = (fullData?.students_count as number) ?? 0
  const hoursPerWeek = (fullData?.hours_per_week as number) ?? 0
  const availabilityRate = (fullData?.availability_rate as number) ?? 0

  const userEmail = fullData?.user_email as string | null | undefined
  const userIsActive = fullData?.user_is_active as boolean | null | undefined
  const userLastLogin = fullData?.user_last_login as string | null | undefined

  return (
    <div className="space-y-4">
      {/* KPI cards clickables — switch vers tab pertinent (Wave-style 1-tap) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard onClick={() => onTabChange?.("classes")}>
          <CircularProgress
            value={classesCount > 0 ? 100 : 0}
            label={`${classesCount} classe${classesCount > 1 ? "s" : ""}`}
            sublabel="Classes assignées"
            color="#6366f1"
            icon={<GraduationCap className="h-4 w-4 text-muted-foreground/60" />}
          />
        </KpiCard>

        <KpiCard onClick={() => onTabChange?.("classes")}>
          <CircularProgress
            value={studentsCount > 0 ? 100 : 0}
            label={`${studentsCount} élève${studentsCount > 1 ? "s" : ""}`}
            sublabel="Élèves total"
            color="#6366f1"
            icon={<Users className="h-4 w-4 text-muted-foreground/60" />}
          />
        </KpiCard>

        <KpiCard onClick={() => onTabChange?.("emploi-du-temps")}>
          <CircularProgress
            value={hoursPerWeek > 0 ? Math.min((hoursPerWeek / 30) * 100, 100) : 0}
            label={`${hoursPerWeek}h`}
            sublabel="Heures/semaine"
            color={hoursPerWeek > 25 ? "#ef4444" : hoursPerWeek > 15 ? "#f59e0b" : "#10b981"}
            icon={<Clock className="h-4 w-4 text-muted-foreground/60" />}
          />
        </KpiCard>

        <KpiCard onClick={() => onTabChange?.("disponibilites")}>
          <CircularProgress
            value={availabilityRate}
            label={`${Math.round(availabilityRate)}%`}
            sublabel="Disponibilité"
            icon={<CalendarCheck className="h-4 w-4 text-muted-foreground/60" />}
          />
        </KpiCard>
      </div>

      {/* Informations contact + compte — drop Spécialité (déjà header), Téléphone clickable */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Contact &amp; compte
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teacher.phone ? (
              <a
                href={`tel:${teacher.phone}`}
                className="flex items-start gap-3 rounded-md p-2 -m-2 hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Phone className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Téléphone</p>
                  <p className="text-sm font-medium text-primary truncate">{teacher.phone}</p>
                </div>
              </a>
            ) : (
              <InfoItem
                icon={<Phone className="h-4 w-4" />}
                label="Téléphone"
                value="Non renseigné"
              />
            )}
            <InfoItem
              icon={<Mail className="h-4 w-4" />}
              label="Email de connexion"
              value={userEmail ?? "Non renseigné"}
            />
            <AccountStatusItem isActive={userIsActive} lastLogin={userLastLogin} />
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

function KpiCard({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="group block w-full text-left focus:outline-none focus:ring-2 focus:ring-primary rounded-lg disabled:cursor-default"
    >
      <Card className="border-0 shadow-sm ring-1 ring-border transition-all group-hover:ring-primary group-hover:shadow-md group-disabled:hover:ring-border group-disabled:hover:shadow-sm">
        <CardContent className="p-4 relative">
          {children}
          {onClick && (
            <ChevronRight className="absolute right-3 top-3 h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary" />
          )}
        </CardContent>
      </Card>
    </button>
  )
}

function AccountStatusItem({
  isActive,
  lastLogin,
}: {
  isActive: boolean | null | undefined
  lastLogin: string | null | undefined
}) {
  // Tri-état sémantique (principe 14 redesign-premium) : !lastLogin AVANT !isActive.
  let badge: { label: string; className: string }
  if (!lastLogin) {
    badge = {
      label: "En attente",
      className:
        "border-amber-500 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20",
    }
  } else if (isActive === false) {
    badge = { label: "Désactivé", className: "" }
  } else {
    badge = { label: "Actif", className: "border-emerald-500 text-emerald-600" }
  }

  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <User className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Statut compte</p>
        <Badge variant={badge.label === "Désactivé" ? "destructive" : "outline"} className={`text-xs ${badge.className}`}>
          {badge.label}
        </Badge>
      </div>
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
