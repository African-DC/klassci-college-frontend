"use client"

import { Briefcase, Users, BadgeCheck, Phone, UserX } from "lucide-react"
import { CrudPageLayout } from "@/components/shared/CrudPageLayout"
import { type HeroKpi } from "@/components/shared/PageHero"
import { StaffTable } from "./StaffTable"
import { StaffCreateModal } from "./StaffCreateModal"
import { useAdminSummary } from "@/lib/hooks/useDashboard"

export function StaffPageClient() {
  const { data } = useAdminSummary()
  const s = data?.staff
  const kpis: HeroKpi[] = [
    { label: "Personnel", value: s?.total ?? 0, icon: Users },
    { label: "Postes distincts", value: s?.distinct_positions ?? 0, icon: BadgeCheck },
    { label: "Avec téléphone", value: s?.with_phone ?? 0, icon: Phone },
    { label: "Sans poste", value: s?.without_position ?? 0, icon: UserX },
  ]

  return (
    <CrudPageLayout
      title="Personnel"
      subtitle="Gestion du personnel administratif"
      createLabel="Nouveau personnel"
      icon={Briefcase}
      kpis={kpis}
      table={<StaffTable />}
      createModal={(props) => <StaffCreateModal {...props} />}
    />
  )
}
