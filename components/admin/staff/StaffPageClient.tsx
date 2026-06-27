"use client"

import { useMemo } from "react"
import { Briefcase, Users, BadgeCheck, Phone, UserX } from "lucide-react"
import { CrudPageLayout } from "@/components/shared/CrudPageLayout"
import { KpiStrip, type KpiItem } from "@/components/shared/list/KpiStrip"
import { StaffTable } from "./StaffTable"
import { StaffCreateModal } from "./StaffCreateModal"
import { useStaffList } from "@/lib/hooks/useStaff"

function StaffKpis() {
  const { data } = useStaffList({ size: 200 })
  const kpis: KpiItem[] = useMemo(() => {
    const items = data?.items ?? []
    const total = data?.total ?? items.length
    const distinctPositions = new Set(items.map((s) => s.position?.trim()).filter(Boolean)).size
    const withPhone = items.filter((s) => s.phone?.trim()).length
    const withoutPosition = items.filter((s) => !s.position?.trim()).length
    return [
      { label: "Personnel", value: total, icon: Users, tone: "primary" },
      { label: "Postes distincts", value: distinctPositions, icon: BadgeCheck, tone: "default" },
      { label: "Avec téléphone", value: withPhone, icon: Phone, tone: "default" },
      { label: "Sans poste", value: withoutPosition, icon: UserX, tone: withoutPosition > 0 ? "accent" : "default" },
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
