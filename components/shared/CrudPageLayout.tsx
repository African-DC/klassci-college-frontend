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
}

export function CrudPageLayout({ title, subtitle, createLabel, icon, table, createModal, kpis }: CrudPageLayoutProps) {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="space-y-6">
      <PageHero
        icon={icon}
        title={title}
        subtitle={subtitle}
        kpis={kpis}
        actions={
          <button type="button" className={heroAccentBtn} onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> {createLabel}
          </button>
        }
      />
      {table}
      {createModal({ open: createOpen, onClose: () => setCreateOpen(false) })}
    </div>
  )
}
