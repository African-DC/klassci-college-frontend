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
        onRetry={() => refetch()}
      />
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        title="Eleves inscrits"
        value={data?.enrolled_students ?? 0}
        description="Inscriptions validees"
        icon={GraduationCap}
      />
      <KpiCard
        title="Paiements en attente"
        value={data?.pending_payments ?? 0}
        description="A traiter"
        icon={Wallet}
      />
      <KpiCard
        title="Cours du jour"
        value={data?.courses_today ?? 0}
        description="Programmes aujourd'hui"
        icon={CalendarDays}
      />
      <KpiCard
        title="Alertes"
        value={data?.alerts ?? 0}
        description="Evaluations sans notes"
        icon={AlertTriangle}
      />
    </div>
  )
}
