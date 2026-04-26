"use client"

import {
  GraduationCap,
  Wallet,
  CalendarDays,
  AlertTriangle,
} from "lucide-react"
import { KpiCard } from "./KpiCard"
import { KpiCardSkeleton } from "./KpiCardSkeleton"
import { DataError } from "@/components/shared/DataError"
import { useDashboardStats } from "@/lib/hooks/useDashboard"

export function DashboardKpis() {
  const { data, isLoading, isError, error, refetch } = useDashboardStats()

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <DataError
        message={error?.message || "Impossible de charger les statistiques du dashboard"}
        onRetry={refetch}
      />
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        title="Élèves inscrits"
        value={data?.enrolled_students ?? 0}
        description={
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {data?.enrollment_validated ?? 0} validées
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
              {data?.enrollment_prospect ?? 0} prospects
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
              {data?.enrollment_pending ?? 0} en attente
            </span>
          </span>
        }
        icon={GraduationCap}
        variant="blue"
      />
      <KpiCard
        title="Paiements en attente"
        value={data?.pending_payments ?? 0}
        description="À traiter"
        icon={Wallet}
        variant="orange"
      />
      <KpiCard
        title="Cours du jour"
        value={data?.courses_today ?? 0}
        description="Programmés aujourd'hui"
        icon={CalendarDays}
        variant="emerald"
      />
      <KpiCard
        title="Alertes"
        value={data?.alerts ?? 0}
        description="Évaluations sans notes"
        icon={AlertTriangle}
        variant="rose"
      />
    </div>
  )
}
