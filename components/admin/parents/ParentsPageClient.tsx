"use client"

import { useMemo, useState } from "react"
import { HeartHandshake, Plus, Users, UserCheck, UserX, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { KpiStrip, type KpiItem } from "@/components/shared/list/KpiStrip"
import { useParents } from "@/lib/hooks/useParents"
import { ParentsTable } from "./ParentsTable"
import { ParentCreateModal } from "./ParentCreateModal"

export function ParentsPageClient() {
  const [createOpen, setCreateOpen] = useState(false)
  const { data } = useParents({ size: 200 })
  const total = data?.total ?? 0

  const kpis: KpiItem[] = useMemo(() => {
    const items = data?.items ?? []
    const withAccount = items.filter((p) => !!p.user_id).length
    const withEmail = items.filter((p) => p.email?.trim()).length
    return [
      { label: "Parents au total", value: total, icon: Users, tone: "primary" },
      { label: "Avec compte", value: withAccount, icon: UserCheck, tone: "emerald" },
      { label: "Sans compte", value: items.length - withAccount, icon: UserX, tone: items.length - withAccount > 0 ? "accent" : "default" },
      { label: "Avec email", value: withEmail, icon: Mail, tone: "default" },
    ]
  }, [data, total])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <HeartHandshake aria-hidden="true" className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="font-serif text-xl tracking-tight sm:text-2xl">Parents</h1>
            <p className="text-sm text-muted-foreground">
              {total} {total > 1 ? "parents au total" : "parent au total"}
            </p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="h-11 gap-2 sm:h-10">
          <Plus className="h-4 w-4" />
          Nouveau parent
        </Button>
      </div>
      <KpiStrip items={kpis} />
      <ParentsTable />
      <ParentCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
