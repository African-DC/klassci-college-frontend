"use client"

import { useState } from "react"
import { Plus, type LucideIcon } from "lucide-react"
import { PageHero, heroAccentBtn, type HeroKpi } from "@/components/shared/PageHero"

interface CrudPageLayoutProps {
  title: string
  subtitle: string
  createLabel: string
  icon?: LucideIcon
  table: React.ReactNode
  createModal: (props: { open: boolean; onClose: () => void }) => React.ReactNode
  /** KPIs intégrés dans le hero (monochrome, cf. premium-design-system). */
  kpis?: HeroKpi[]
  /** Actions métier propres à la page, sans duplication du hero commun. */
  extraActions?: React.ReactNode
}

export function CrudPageLayout({ title, subtitle, createLabel, icon, table, createModal, kpis, extraActions }: CrudPageLayoutProps) {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="space-y-6">
      <PageHero
        icon={icon}
        title={title}
        subtitle={subtitle}
        kpis={kpis}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {extraActions}
          <button type="button" className={heroAccentBtn} onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> {createLabel}
          </button>
          </div>
        }
      />
      {table}
      {createModal({ open: createOpen, onClose: () => setCreateOpen(false) })}
    </div>
  )
}
