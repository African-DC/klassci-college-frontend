import { auth } from "@/auth"
import { QuickActions } from "@/components/admin/dashboard/QuickActions"
import { DashboardCharts } from "@/components/admin/dashboard/DashboardChartsWrapper"
import { DashboardHero } from "@/components/admin/dashboard/DashboardHero"
import { RecentActivity } from "@/components/admin/dashboard/RecentActivity"
import { StaffDashboard } from "@/components/admin/dashboard/StaffDashboard"

export const metadata = { title: "Dashboard | KLASSCI" }

export default async function DashboardPage() {
  const session = await auth()

  // Le personnel (secrétariat) dispose d'un tableau de bord dédié, orienté
  // inscriptions / caisse / présences, distinct de la vue administrateur.
  if (session?.user?.role === "staff") {
    return <StaffDashboard />
  }

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
