"use client"

import { CalendarDays, ClipboardList, Wallet, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useStudentDashboard } from "@/lib/hooks/useStudentPortal"

export function StudentDashboardClient() {
  const { data, isLoading, isError } = useStudentDashboard()

  if (isLoading) return <DashboardSkeleton />

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-xl tracking-tight">Espace Élève</h1>
          <p className="text-sm text-muted-foreground">Votre résumé du jour</p>
        </div>
        <div className="py-12 text-center text-sm text-muted-foreground">
          Impossible de charger le tableau de bord. Veuillez réessayer.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="font-serif text-xl tracking-tight">
          Bonjour, {data.student_name.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground">{data.class_name} — Votre résumé du jour</p>
      </div>

      {/* Prochain cours */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-primary uppercase tracking-wider">Prochain cours</p>
            {data.next_course ? (
              <div className="mt-1">
                <p className="text-sm font-semibold">{data.next_course.subject_name}</p>
                <p className="text-xs text-muted-foreground">
                  {data.next_course.start_time} - {data.next_course.end_time}
                  {data.next_course.room && ` • Salle ${data.next_course.room}`}
                  {" • "}{data.next_course.teacher_name}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">Aucun cours programmé</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard
          icon={ClipboardList}
          label="Moyenne"
          value={data.general_average !== null ? `${data.general_average.toFixed(2)}/20` : "—"}
          className={data.general_average !== null && data.general_average >= 10 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600"}
        />
        <KpiCard
          icon={Wallet}
          label="Frais restants"
          value={`${data.fees_remaining.toLocaleString("fr-FR")} FC`}
          className={data.fees_remaining === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-accent"}
        />
        <KpiCard
          icon={AlertCircle}
          label="Absences"
          value={String(data.total_absences)}
          className={data.total_absences > 5 ? "text-destructive" : "text-muted-foreground"}
        />
      </div>
    </div>
  )
}

function KpiCard({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  className?: string
}) {
  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardContent className="p-3 text-center">
        <Icon className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
        <p className={`text-lg font-bold ${className ?? ""}`}>{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
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
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
    </div>
  )
}
