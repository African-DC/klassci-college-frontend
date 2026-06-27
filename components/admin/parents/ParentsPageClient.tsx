"use client"

import { useMemo, useState } from "react"
import { HeartHandshake, Plus, Users, UserCheck, UserX, Mail } from "lucide-react"
import { PageHero, heroAccentBtn, type HeroKpi } from "@/components/shared/PageHero"
import { useAdminSummary } from "@/lib/hooks/useDashboard"
import { ParentsTable } from "./ParentsTable"
import { ParentCreateModal } from "./ParentCreateModal"

export function ParentsPageClient() {
  const [createOpen, setCreateOpen] = useState(false)
  const { data } = useAdminSummary()
  const total = data?.parents.total ?? 0

  const kpis: HeroKpi[] = useMemo(() => {
    const p = data?.parents
    return [
      { label: "Parents au total", value: total, icon: Users },
      { label: "Avec compte", value: p?.with_account ?? 0, icon: UserCheck },
      { label: "Sans compte", value: p?.without_account ?? 0, icon: UserX },
      { label: "Avec email", value: p?.with_email ?? 0, icon: Mail },
    ]
  }, [data, total])

  return (
    <div className="space-y-6">
      <PageHero
        icon={HeartHandshake}
        title="Parents"
        subtitle={`${total} ${total > 1 ? "parents au total" : "parent au total"}`}
        actions={
          <button type="button" className={heroAccentBtn} onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Nouveau parent
          </button>
        }
        kpis={kpis}
      />
      <ParentsTable />
      <ParentCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
