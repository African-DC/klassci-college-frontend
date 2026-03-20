import { DashboardKpis } from "@/components/admin/dashboard/DashboardKpis"
import { DashboardCharts } from "@/components/admin/dashboard/DashboardCharts"
import { QuickActions } from "@/components/admin/dashboard/QuickActions"

export const metadata = { title: "Dashboard | KLASSCI" }

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl tracking-tight">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">
          Vue d&apos;ensemble de votre etablissement
        </p>
      </div>

      <DashboardKpis />

      <QuickActions />

      <DashboardCharts />
    </div>
  )
}
