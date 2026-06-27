"use client"

import { CalendarDays, ClipboardList, Wallet, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHero, type HeroKpi } from "@/components/shared/PageHero"
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
        <PageHero title="Espace Élève" subtitle="Votre résumé du jour" />
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

  // KPIs monochrome dans le hero. On garde la logique "non inscrit" : on
  // affiche "—" tant que l'élève n'a pas d'inscription validée, plutôt que des
  // zéros trompeurs (les couleurs sémantiques restent sur les statuts hors hero).
  const heroKpis: HeroKpi[] = [
    {
      label: "Moyenne",
      value: data.general_average !== null ? `${data.general_average.toFixed(2)}/20` : "—",
      icon: ClipboardList,
    },
    {
      label: "Frais restants",
      value: isEnrolled ? `${data.fees_remaining.toLocaleString("fr-FR")} FCFA` : "—",
      icon: Wallet,
    },
    {
      label: "Absences",
      value: isEnrolled ? String(data.total_absences) : "—",
      icon: AlertCircle,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHero
        title={`Bonjour, ${data.student_name.split(" ")[0]}`}
        subtitle={subtitle}
        kpis={heroKpis}
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
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-44 rounded-2xl" />
      <Skeleton className="h-20 rounded-xl" />
    </div>
  )
}
