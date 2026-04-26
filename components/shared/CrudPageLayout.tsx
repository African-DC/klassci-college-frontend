"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, type LucideIcon } from "lucide-react"

interface CrudPageLayoutProps {
  title: string
  subtitle: string
  createLabel: string
  icon?: LucideIcon
  table: React.ReactNode
  createModal: (props: { open: boolean; onClose: () => void }) => React.ReactNode
  kpiCards?: React.ReactNode
}

export function CrudPageLayout({ title, subtitle, createLabel, icon: Icon, table, createModal, kpiCards }: CrudPageLayoutProps) {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )}
          <div>
            <h1 className="font-serif text-2xl tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> {createLabel}
        </Button>
      </div>
      {kpiCards}
      {table}
      {createModal({ open: createOpen, onClose: () => setCreateOpen(false) })}
    </div>
  )
}
