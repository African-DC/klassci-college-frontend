"use client"

import { Gauge, Info } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DataError } from "@/components/shared/DataError"
import { PageHero } from "@/components/shared/PageHero"
import { CircularProgress } from "@/components/shared/CircularProgress"
import { PerformanceAxisCard, RatingPill } from "@/components/shared/performance/PerformanceParts"
import { useMyPerformance } from "@/lib/hooks/usePerformance"
import { formatScore, ratingConfig } from "@/lib/utils/performance"

export function TeacherPerformanceClient() {
  const { data, isLoading, isError, refetch } = useMyPerformance()

  if (isLoading) return <PerformanceSkeleton />

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHero icon={Gauge} title="Ma performance" subtitle="Votre score et son détail" />
        <DataError message="Impossible de charger votre performance." onRetry={() => refetch()} />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHero icon={Gauge} title="Ma performance" subtitle="Votre score et son détail" />
        <div className="py-12 text-center text-sm text-muted-foreground">
          Aucune donnée disponible.
        </div>
      </div>
    )
  }

  const perf = data.performance
  const cfg = ratingConfig(perf.rating)

  return (
    <div className="space-y-6">
      <PageHero
        icon={Gauge}
        title="Ma performance"
        subtitle={`Année ${data.academic_year_name}`}
      />

      {/* Score global */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-4">
            <CircularProgress
              value={perf.global_score ?? 0}
              size={92}
              strokeWidth={7}
              color={perf.global_score === null ? "#94a3b8" : cfg.ringColor}
              label={`${formatScore(perf.global_score)}${perf.global_score !== null ? " / 100" : ""}`}
              sublabel="Score global"
            />
          </div>
          <div className="flex flex-col items-center gap-2 sm:items-end">
            <RatingPill rating={perf.rating} />
            <p className="max-w-xs text-center text-xs text-muted-foreground sm:text-right">
              Moyenne pondérée des axes mesurables. Les résultats de vos élèves ne sont pas pris en
              compte.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Détail par axe */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Détail par critère</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {perf.axes.map((axis) => (
            <PerformanceAxisCard key={axis.key} axis={axis} />
          ))}
        </div>
      </section>

      {/* Note explicative */}
      <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          Un critère marqué « données insuffisantes » n'est pas encore mesurable (aucune séance
          pointée, aucune évaluation, ou aucun créneau planifié) : il n'abaisse pas votre score.
        </p>
      </div>
    </div>
  )
}

function PerformanceSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-28 rounded-2xl" />
      <Skeleton className="h-40 rounded-xl" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
    </div>
  )
}
