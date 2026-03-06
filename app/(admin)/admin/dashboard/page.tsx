import { Suspense } from "react"
import { DashboardKpis } from "@/components/admin/dashboard/DashboardKpis"
import { KpiCardSkeleton } from "@/components/admin/dashboard/KpiCardSkeleton"

export const metadata = { title: "Dashboard | KLASSCI" }

function KpisSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <KpiCardSkeleton key={i} />
      ))}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Vue d&apos;ensemble de votre etablissement
        </p>
      </div>

      <Suspense fallback={<KpisSkeleton />}>
        <DashboardKpis />
      </Suspense>
    </div>
  )
}
