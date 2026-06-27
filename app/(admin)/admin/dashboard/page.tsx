import { QuickActions } from "@/components/admin/dashboard/QuickActions"
import { DashboardCharts } from "@/components/admin/dashboard/DashboardChartsWrapper"
import { DashboardHero } from "@/components/admin/dashboard/DashboardHero"
import { RecentActivity } from "@/components/admin/dashboard/RecentActivity"

export const metadata = { title: "Dashboard | KLASSCI" }

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <DashboardHero />

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
