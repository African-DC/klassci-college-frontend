import { DashboardKpis } from "@/components/admin/dashboard/DashboardKpis"
import { QuickActions } from "@/components/admin/dashboard/QuickActions"
import { DashboardCharts } from "@/components/admin/dashboard/DashboardChartsWrapper"
import { WelcomeHeader } from "@/components/admin/dashboard/WelcomeHeader"
import { RecentActivity } from "@/components/admin/dashboard/RecentActivity"

export const metadata = { title: "Dashboard | KLASSCI" }

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <WelcomeHeader />

      <DashboardKpis />

      <QuickActions />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardCharts />
        </div>
        <RecentActivity />
      </div>
    </div>
  )
}
