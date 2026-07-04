import { RecentActivity } from "./RecentActivity"
import { StaffHero } from "./StaffHero"
import { StaffQuickActions } from "./StaffQuickActions"

/** Tableau de bord dédié au personnel (secrétariat) — orienté inscriptions,
 * caisse et présences, distinct du tableau de bord administrateur. */
export function StaffDashboard() {
  return (
    <div className="space-y-6">
      <StaffHero />
      <StaffQuickActions />
      <RecentActivity />
    </div>
  )
}
