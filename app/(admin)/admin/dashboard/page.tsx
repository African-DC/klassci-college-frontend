import dynamic from "next/dynamic"
import { DashboardKpis } from "@/components/admin/dashboard/DashboardKpis"
import { QuickActions } from "@/components/admin/dashboard/QuickActions"
import { Skeleton } from "@/components/ui/skeleton"

const DashboardCharts = dynamic(
  () => import("@/components/admin/dashboard/DashboardCharts").then((m) => m.DashboardCharts),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    ),
  },
)
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
