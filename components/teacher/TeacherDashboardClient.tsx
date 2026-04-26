"use client"

import Link from "next/link"
import {
  CalendarDays,
  Users,
  BookOpen,
  ClipboardList,
  ChevronRight,
  AlertTriangle,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DataError } from "@/components/shared/DataError"
import { useTeacherDashboard } from "@/lib/hooks/useTeacherPortal"
import type { TeacherUpcomingEval } from "@/lib/contracts/teacher-portal"

export function TeacherDashboardClient() {
  const { data, isLoading, isError, refetch } = useTeacherDashboard()

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
      <DashboardHeader name={data.teacher_name} />

      {/* Prochain cours */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-primary uppercase tracking-wider">
              Prochain cours
            </p>
            {data.next_course ? (
              <div className="mt-1">
                <p className="text-sm font-semibold">
                  {data.next_course.subject_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.next_course.start_time} - {data.next_course.end_time}
                  {" • "}{data.next_course.class_name}
                  {data.next_course.room && ` • Salle ${data.next_course.room}`}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">
                Aucun cours programmé
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.total_students}</p>
              <p className="text-[10px] text-muted-foreground">Élèves</p>
            </div>
          </CardContent>
        </Card>
        <Link href="/teacher/classes">
          <Card className="border-0 shadow-sm ring-1 ring-border hover:ring-primary/50 transition-colors">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold">{data.total_classes}</p>
                <p className="text-[10px] text-muted-foreground">Classes</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Évaluations à venir */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Évaluations à venir</h2>
        {data.upcoming_evaluations.length === 0 ? (
          <Card className="border-0 shadow-sm ring-1 ring-border">
            <CardContent className="py-8 text-center">
              <ClipboardList className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Aucune évaluation programmée.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {data.upcoming_evaluations.map((evaluation) => (
              <EvaluationCard key={evaluation.id} evaluation={evaluation} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DashboardHeader({ name }: { name: string | null }) {
  return (
    <div>
      <h1 className="font-serif text-xl tracking-tight">
        {name ? `Bonjour, ${name.split(" ")[0]}` : "Espace Enseignant"}
      </h1>
      <p className="text-sm text-muted-foreground">
        Votre journée en un coup d&apos;œil
      </p>
    </div>
  )
}

function EvaluationCard({ evaluation }: { evaluation: TeacherUpcomingEval }) {
  const gradedPercent =
    evaluation.total_students > 0
      ? Math.round((evaluation.graded_students / evaluation.total_students) * 100)
      : 0
  const needsGrading = evaluation.graded_students < evaluation.total_students

  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{evaluation.title}</p>
            <p className="text-xs text-muted-foreground">
              {evaluation.class_name} • {evaluation.subject_name}
            </p>
            <p className="text-xs text-muted-foreground">{evaluation.date}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge variant="secondary" className="text-[10px]">
              {evaluation.type}
            </Badge>
            {needsGrading && (
              <span className="flex items-center gap-1 text-[10px] text-accent">
                <AlertTriangle className="h-3 w-3" />
                {gradedPercent}% noté
              </span>
            )}
          </div>
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
