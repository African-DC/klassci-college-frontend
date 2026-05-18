"use client"

import Link from "next/link"
import { Users, GraduationCap, Wallet, AlertCircle, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DataError } from "@/components/shared/DataError"
import { AcademicYearBanner } from "@/components/shared/AcademicYearBanner"
import { NotEnrolledBanner } from "@/components/shared/NotEnrolledBanner"
import { useParentDashboard } from "@/lib/hooks/useParentPortal"
import type { ParentChild } from "@/lib/contracts/parent-portal"
import { isEnrolledFromClassName, summarizeEnrollment } from "@/lib/utils/enrollment-status"

/** Seuil d'absences au-delà duquel on affiche un avertissement */
const ABSENCES_WARNING_THRESHOLD = 5

export function ParentDashboardClient() {
  const { data, isLoading, isError, refetch } = useParentDashboard()

  if (isLoading) return <DashboardSkeleton />

  if (isError) {
    return (
      <div className="space-y-6">
        <DashboardHeader name={null} />
        <DataError message="Impossible de charger le tableau de bord." onRetry={() => refetch()} />
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

  const enrollment = summarizeEnrollment(data.children)

  return (
    <div className="space-y-6">
      <DashboardHeader name={data.parent_name} />

      <AcademicYearBanner
        currentYear={data.current_academic_year}
        role="parent"
      />

      {/* Résumé — "Mes enfants" (relation parent-enfant) avec breakdown
          inscrit / en attente quand il y a un mix. Le label "Enfants inscrits"
          précédent était trompeur : il comptait les enfants suivis, pas ceux
          réellement inscrits à l'année courante. */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-primary uppercase tracking-wider font-medium">Mes enfants</p>
            <p className="text-2xl font-bold leading-tight">{enrollment.total}</p>
            {enrollment.total > 0 && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {enrollment.enrolled} inscrit{enrollment.enrolled > 1 ? "s" : ""}
                {enrollment.pending > 0 && (
                  <>
                    {" · "}
                    <span className="font-medium text-amber-700 dark:text-amber-400">
                      {enrollment.pending} en attente
                    </span>
                  </>
                )}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cartes enfants */}
      {data.children.length === 0 ? (
        <div className="py-12 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Aucun enfant lié à votre compte.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.children.map((child) => (
            <ChildCard
              key={child.id}
              child={child}
              academicYear={data.current_academic_year}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function DashboardHeader({ name }: { name: string | null }) {
  return (
    <div>
      <h1 className="font-serif text-xl tracking-tight">
        {name ? `Bonjour, ${name.split(" ")[0]}` : "Espace Parent"}
      </h1>
      <p className="text-sm text-muted-foreground">Résumé de vos enfants</p>
    </div>
  )
}

function ChildCard({
  child,
  academicYear,
}: {
  child: ParentChild
  academicYear: string | null | undefined
}) {
  const isEnrolled = isEnrolledFromClassName(child.class_name)

  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardContent className="p-4 space-y-3">
        {/* En-tête enfant */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{child.full_name}</p>
            <p className="text-xs text-muted-foreground">
              {isEnrolled ? (
                child.class_name
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                  En attente d&apos;inscription
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Banner inline si pas inscrit — explique POURQUOI les KPIs sont
            vides, et donne l'action à prendre (passage au secrétariat). */}
        {!isEnrolled && (
          <NotEnrolledBanner
            audience="parent"
            studentName={child.full_name}
            academicYear={academicYear}
            variant="inline"
          />
        )}

        {/* KPIs — neutralisés (—) tant que l'enfant n'est pas inscrit.
            Sinon faux signal vert "0 FCFA = tout payé" alors qu'aucun frais
            n'a encore été affecté. */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-muted/50 p-2 text-center">
            <GraduationCap className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
            <p
              className={`text-sm font-bold ${
                !isEnrolled || child.general_average === null
                  ? "text-muted-foreground"
                  : child.general_average >= 10
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-destructive"
              }`}
            >
              {isEnrolled && child.general_average !== null
                ? child.general_average.toFixed(2)
                : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">Moyenne</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2 text-center">
            <AlertCircle className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
            <p
              className={`text-sm font-bold ${
                !isEnrolled
                  ? "text-muted-foreground"
                  : child.total_absences > ABSENCES_WARNING_THRESHOLD
                    ? "text-accent"
                    : ""
              }`}
            >
              {isEnrolled ? child.total_absences : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">Absences</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2 text-center">
            <Wallet className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
            <p
              className={`text-sm font-bold ${
                !isEnrolled
                  ? "text-muted-foreground"
                  : child.fees_remaining > 0
                    ? "text-accent"
                    : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {isEnrolled ? child.fees_remaining.toLocaleString("fr-FR") : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">Reste (FCFA)</p>
          </div>
        </div>

        {/* Liens rapides — désactivés quand pas inscrit (pas de contenu utile
            à voir, et éviter de générer des fetches 404/500 inutiles). */}
        {isEnrolled ? (
          <div className="flex gap-2">
            <Link
              href={`/parent/children/${child.id}/grades`}
              className="flex flex-1 items-center justify-center gap-1 rounded-md border px-3 py-2 text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
            >
              Notes <ChevronRight className="h-3 w-3" />
            </Link>
            <Link
              href={`/parent/children/${child.id}/fees`}
              className="flex flex-1 items-center justify-center gap-1 rounded-md border px-3 py-2 text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
            >
              Frais <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <p className="text-center text-[11px] text-muted-foreground">
            Notes et frais seront disponibles après validation de l&apos;inscription.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-20 rounded-lg" />
      {Array.from({ length: 2 }).map((_, i) => (
        <Skeleton key={i} className="h-44 rounded-lg" />
      ))}
    </div>
  )
}
