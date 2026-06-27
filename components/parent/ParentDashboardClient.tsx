"use client"

import Link from "next/link"
import {
  Users,
  GraduationCap,
  Wallet,
  AlertCircle,
  ChevronRight,
  UserCheck,
  Clock,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { DataError } from "@/components/shared/DataError"
import { PageHero, type HeroKpi } from "@/components/shared/PageHero"
import { AcademicYearBanner } from "@/components/shared/AcademicYearBanner"
import { NotEnrolledBanner } from "@/components/shared/NotEnrolledBanner"
import { useParentDashboard } from "@/lib/hooks/useParentPortal"
import type { ParentChild } from "@/lib/contracts/parent-portal"
import { isEnrolledFromClassName, summarizeEnrollment } from "@/lib/utils/enrollment-status"

/** Seuil d'absences au-delà duquel on affiche un avertissement */
const ABSENCES_WARNING_THRESHOLD = 5

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
}

export function ParentDashboardClient() {
  const { data, isLoading, isError, refetch } = useParentDashboard()

  if (isLoading) return <DashboardSkeleton />

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHero title="Espace Parent" subtitle="Résumé de vos enfants" />
        <DataError message="Impossible de charger le tableau de bord." onRetry={() => refetch()} />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHero title="Espace Parent" subtitle="Résumé de vos enfants" />
        <div className="py-12 text-center text-sm text-muted-foreground">
          Aucune donnée disponible.
        </div>
      </div>
    )
  }

  const enrollment = summarizeEnrollment(data.children)

  // KPIs monochrome dans le hero. Le détail "en attente" garde sa couleur
  // sémantique (amber) sur les cartes enfants en dessous, pas dans le hero.
  const heroKpis: HeroKpi[] = [
    { label: "Mes enfants", value: enrollment.total, icon: Users },
    { label: "Inscrits", value: enrollment.enrolled, icon: UserCheck },
    { label: "En attente", value: enrollment.pending, icon: Clock },
  ]

  return (
    <div className="space-y-6">
      <PageHero
        title={data.parent_name ? `Bonjour, ${data.parent_name.split(" ")[0]}` : "Espace Parent"}
        subtitle="Résumé de vos enfants"
        kpis={heroKpis}
      />

      <AcademicYearBanner currentYear={data.current_academic_year} role="parent" />

      {/* Cartes enfants */}
      {data.children.length === 0 ? (
        <div className="py-12 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" aria-hidden="true" />
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

function ChildCard({
  child,
  academicYear,
}: {
  child: ParentChild
  academicYear: string | null | undefined
}) {
  const isEnrolled = isEnrolledFromClassName(child.class_name)

  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-3 p-4">
        {/* En-tête enfant */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground">
              {initials(child.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{child.full_name}</p>
            {isEnrolled ? (
              <p className="text-xs text-muted-foreground">{child.class_name}</p>
            ) : (
              <Badge
                variant="secondary"
                className="mt-0.5 bg-amber-100 text-[10px] font-medium uppercase tracking-wide text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
              >
                En attente d&apos;inscription
              </Badge>
            )}
          </div>
        </div>

        {/* Banner inline si pas inscrit */}
        {!isEnrolled && (
          <NotEnrolledBanner
            audience="parent"
            studentName={child.full_name}
            academicYear={academicYear}
            variant="inline"
          />
        )}

        {/* KPIs — neutralisés (—) tant que l'enfant n'est pas inscrit. */}
        <div className="grid grid-cols-3 gap-2">
          <ChildKpi
            icon={GraduationCap}
            label="Moyenne"
            value={
              isEnrolled && child.general_average !== null
                ? child.general_average.toFixed(2)
                : "—"
            }
            valueClassName={
              !isEnrolled || child.general_average === null
                ? "text-muted-foreground"
                : child.general_average >= 10
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-destructive"
            }
          />
          <ChildKpi
            icon={AlertCircle}
            label="Absences"
            value={isEnrolled ? String(child.total_absences) : "—"}
            valueClassName={
              !isEnrolled
                ? "text-muted-foreground"
                : child.total_absences > ABSENCES_WARNING_THRESHOLD
                  ? "text-accent"
                  : "text-foreground"
            }
          />
          <ChildKpi
            icon={Wallet}
            label="Reste (FCFA)"
            value={isEnrolled ? child.fees_remaining.toLocaleString("fr-FR") : "—"}
            valueClassName={
              !isEnrolled
                ? "text-muted-foreground"
                : child.fees_remaining > 0
                  ? "text-accent"
                  : "text-emerald-600 dark:text-emerald-400"
            }
          />
        </div>

        {/* Liens rapides — actifs seulement si inscrit */}
        {isEnrolled ? (
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="h-11 flex-1 sm:h-9">
              <Link href={`/parent/children/${child.id}/grades`}>
                Notes
                <ChevronRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="h-11 flex-1 sm:h-9">
              <Link href={`/parent/children/${child.id}/fees`}>
                Frais
                <ChevronRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
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

function ChildKpi({
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
    <div className="rounded-lg border bg-muted/30 p-2 text-center">
      <Icon className="mx-auto mb-1 h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <p className={`text-sm font-bold tabular-nums ${valueClassName ?? ""}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40 rounded-2xl" />
      {Array.from({ length: 2 }).map((_, i) => (
        <Skeleton key={i} className="h-44 rounded-lg" />
      ))}
    </div>
  )
}
