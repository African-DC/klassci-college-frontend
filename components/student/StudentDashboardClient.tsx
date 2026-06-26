"use client"

import { CalendarDays, ClipboardList, Wallet, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { AcademicYearBanner } from "@/components/shared/AcademicYearBanner"
import { NotEnrolledBanner } from "@/components/shared/NotEnrolledBanner"
import { useStudentDashboard } from "@/lib/hooks/useStudentPortal"
import { isEnrolledFromClassName } from "@/lib/utils/enrollment-status"

export function StudentDashboardClient() {
  const { data, isLoading, isError } = useStudentDashboard()

  if (isLoading) return <DashboardSkeleton />

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <DashboardHeader title="Espace Élève" subtitle="Votre résumé du jour" />
        <div className="py-12 text-center text-sm text-muted-foreground">
          Impossible de charger le tableau de bord. Veuillez réessayer.
        </div>
      </div>
    )
  }

  const isEnrolled = isEnrolledFromClassName(data.class_name)
  // Quand l'élève n'est pas (encore) inscrit, le BE renvoie `class_name: "—"`.
  // On ne montre PAS ce placeholder dans le sous-titre : il dégrade en
  // mention simple, et le banner explique la situation en clair.
  const subtitle = isEnrolled
    ? `${data.class_name} · Votre résumé du jour`
    : "Votre espace personnel"

  return (
    <div className="space-y-6">
      <DashboardHeader
        title={`Bonjour, ${data.student_name.split(" ")[0]}`}
        subtitle={subtitle}
      />

      <AcademicYearBanner currentYear={data.current_academic_year} role="student" />

      {!isEnrolled && (
        <NotEnrolledBanner audience="student" academicYear={data.current_academic_year} />
      )}

      {/* Prochain cours — seul accent primary */}
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
                  {data.next_course.room && ` · Salle ${data.next_course.room}`}
                  {" · "}
                  {data.next_course.teacher_name}
                </p>
              </div>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">Aucun cours programmé</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPIs — `—` muted quand non applicable pour éviter le faux signal
          "0 FCFA vert = tout payé" alors qu'aucun frais n'est encore affecté. */}
      <div className="grid grid-cols-3 gap-3">
        <KpiTile
          icon={ClipboardList}
          label="Moyenne"
          value={data.general_average !== null ? `${data.general_average.toFixed(2)}/20` : "—"}
          valueClassName={
            data.general_average === null
              ? "text-muted-foreground"
              : data.general_average >= 10
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-amber-600"
          }
        />
        <KpiTile
          icon={Wallet}
          label="Frais restants"
          value={isEnrolled ? `${data.fees_remaining.toLocaleString("fr-FR")} FCFA` : "—"}
          valueClassName={
            !isEnrolled
              ? "text-muted-foreground"
              : data.fees_remaining === 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-accent"
          }
        />
        <KpiTile
          icon={AlertCircle}
          label="Absences"
          value={isEnrolled ? String(data.total_absences) : "—"}
          valueClassName={
            !isEnrolled
              ? "text-muted-foreground"
              : data.total_absences > 5
                ? "text-destructive"
                : "text-foreground"
          }
        />
      </div>
    </div>
  )
}

function DashboardHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-serif text-2xl tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <Separator />
    </div>
  )
}

function KpiTile({
  icon: Icon,
  label,
  value,
  valueClassName,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-3 text-center">
        <Icon className="mx-auto mb-1 h-5 w-5 text-muted-foreground" aria-hidden="true" />
        <p className={`text-lg font-bold tabular-nums ${valueClassName ?? ""}`}>{value}</p>
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
