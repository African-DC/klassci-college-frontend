"use client"

import { useMemo } from "react"
import { Briefcase, Users, BadgeCheck, Phone, UserX } from "lucide-react"
import { CrudPageLayout } from "@/components/shared/CrudPageLayout"
import { KpiStrip, type KpiItem } from "@/components/shared/list/KpiStrip"
import { StaffTable } from "./StaffTable"
import { StaffCreateModal } from "./StaffCreateModal"
import { useAdminSummary } from "@/lib/hooks/useDashboard"

function StaffKpis() {
  const { data } = useAdminSummary()
  const kpis: KpiItem[] = useMemo(() => {
    const s = data?.staff
    const withoutPosition = s?.without_position ?? 0
    return [
      { label: "Personnel", value: s?.total ?? 0, icon: Users, tone: "primary" },
      { label: "Postes distincts", value: s?.distinct_positions ?? 0, icon: BadgeCheck, tone: "emerald" },
      { label: "Avec téléphone", value: s?.with_phone ?? 0, icon: Phone, tone: "accent" },
      { label: "Sans poste", value: withoutPosition, icon: UserX, tone: withoutPosition > 0 ? "destructive" : "default" },
    ]
  }, [data])
  return <KpiStrip items={kpis} />
}

export function StaffPageClient() {
  return (
    <CrudPageLayout
      title="Personnel"
      subtitle="Gestion du personnel administratif"
      createLabel="Nouveau personnel"
      icon={Briefcase}
      kpiCards={<StaffKpis />}
      table={<StaffTable />}
      createModal={(props) => <StaffCreateModal {...props} />}
    />
  )
}
