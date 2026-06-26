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

  const pendingPayments = data?.pending_payments ?? 0
  const alerts = data?.alerts ?? 0

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        title="Élèves inscrits"
        value={data?.enrolled_students ?? 0}
        description={
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
              {data?.enrollment_validated ?? 0} validées
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
              {data?.enrollment_prospect ?? 0} prospects
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
              {data?.enrollment_pending ?? 0} en attente
            </span>
          </span>
        }
        icon={GraduationCap}
        tone="primary"
      />
      <KpiCard
        title="Paiements en attente"
        value={pendingPayments}
        description="À traiter"
        icon={Wallet}
        tone={pendingPayments > 0 ? "accent" : "default"}
      />
      <KpiCard
        title="Cours du jour"
        value={data?.courses_today ?? 0}
        description="Programmés aujourd'hui"
        icon={CalendarDays}
        tone="default"
      />
      <KpiCard
        title="Alertes"
        value={alerts}
        description="Évaluations sans notes"
        icon={AlertTriangle}
        tone={alerts > 0 ? "destructive" : "default"}
      />
    </div>
  )
}
