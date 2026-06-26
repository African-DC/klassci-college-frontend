"use client"

import { useState } from "react"
import Link from "next/link"
import {
  CalendarDays,
  Users,
  BookOpen,
  ClipboardList,
  ChevronRight,
  CalendarX,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { DataError } from "@/components/shared/DataError"
import { AcademicYearBanner } from "@/components/shared/AcademicYearBanner"
import { useTeacherDashboard } from "@/lib/hooks/useTeacherPortal"
import type { TeacherUpcomingEval } from "@/lib/contracts/teacher-portal"
import { SelfDeclareAbsenceModal } from "./SelfDeclareAbsenceModal"

export function TeacherDashboardClient() {
  const { data, isLoading, isError, refetch } = useTeacherDashboard()
  const [selfDeclareOpen, setSelfDeclareOpen] = useState(false)

  if (isLoading) return <DashboardSkeleton />

  if (isError) {
    return (
      <div className="space-y-6">
        <DashboardHeader name={null} />
        <DataError
          message="Impossible de charger le tableau de bord."
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <DashboardHeader name={null} />
        <div className="py-12 text-center text-sm text-muted-foreground">
          Aucune donnée disponible.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <DashboardHeader name={data.teacher_name}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelfDeclareOpen(true)}
          className="h-11 sm:h-9"
        >
          <CalendarX className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Me déclarer absent
        </Button>
      </DashboardHeader>

      <AcademicYearBanner currentYear={data.current_academic_year} role="teacher" />

      {/* Prochain cours — seul accent primary (mise en valeur) */}
      <Card className="border-primary/30 bg-primary/5 shadow-sm">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CalendarDays className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-primary">
              Prochain cours
            </p>
            {data.next_course ? (
              <div className="mt-1">
                <p className="text-sm font-semibold">{data.next_course.subject_name}</p>
                <p className="text-xs text-muted-foreground">
                  {data.next_course.start_time} - {data.next_course.end_time}
                  {" · "}
                  {data.next_course.class_name}
                  {data.next_course.room && ` · Salle ${data.next_course.room}`}
                </p>
              </div>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">Aucun cours programmé</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPIs — Card neutres shadcn */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Users} value={data.total_students} label="Élèves" />
        <Link href="/teacher/classes" className="group">
          <StatCard
            icon={BookOpen}
            value={data.total_classes}
            label="Classes"
            className="transition-colors group-hover:border-primary/40"
            trailing={<ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
          />
        </Link>
      </div>

      {/* Évaluations à venir */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Évaluations à venir</h2>
        {data.upcoming_evaluations.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="py-8 text-center">
              <ClipboardList
                className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50"
                aria-hidden="true"
              />
              <p className="text-sm text-muted-foreground">Aucune évaluation programmée.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {data.upcoming_evaluations.map((evaluation) => (
              <EvaluationCard key={evaluation.id} evaluation={evaluation} />
            ))}
          </div>
        )}
      </section>

      <SelfDeclareAbsenceModal
        open={selfDeclareOpen}
        onClose={() => setSelfDeclareOpen(false)}
      />
    </div>
  )
}

function DashboardHeader({
  name,
  children,
}: {
  name: string | null
  children?: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-serif text-2xl tracking-tight">
            {name ? `Bonjour, ${name.split(" ")[0]}` : "Espace Enseignant"}
          </h1>
          <p className="text-sm text-muted-foreground">Votre journée en un coup d&apos;œil</p>
        </div>
        {children}
      </div>
      <Separator />
    </div>
  )
}

function StatCard({
  icon: Icon,
  value,
  label,
  className,
  trailing,
}: {
  icon: React.ComponentType<{ className?: string }>
  value: React.ReactNode
  label: string
  className?: string
  trailing?: React.ReactNode
}) {
  return (
    <Card className={`shadow-sm ${className ?? ""}`}>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="flex-1">
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
        {trailing}
      </CardContent>
    </Card>
  )
}

function EvaluationCard({ evaluation }: { evaluation: TeacherUpcomingEval }) {
  const gradedPercent =
    evaluation.total_students > 0
      ? Math.round((evaluation.graded_students / evaluation.total_students) * 100)
      : 0
  const needsGrading = evaluation.graded_students < evaluation.total_students

  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{evaluation.title}</p>
            <p className="text-xs text-muted-foreground">
              {evaluation.class_name} · {evaluation.subject_name}
            </p>
            <p className="text-xs text-muted-foreground">{evaluation.date}</p>
          </div>
          <Badge variant="secondary" className="shrink-0 text-[10px] capitalize">
            {evaluation.type}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Progress
            value={gradedPercent}
            className="h-1.5"
            aria-label={`${gradedPercent}% des copies notées`}
          />
          <span
            className={`shrink-0 text-[10px] font-medium tabular-nums ${
              needsGrading ? "text-accent" : "text-muted-foreground"
            }`}
          >
            {gradedPercent}% noté
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-20 rounded-xl" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </div>
    </div>
  )
}
