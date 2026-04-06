"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface CrudPageLayoutProps {
  title: string
  subtitle: string
  createLabel: string
  table: React.ReactNode
  createModal: (props: { open: boolean; onClose: () => void }) => React.ReactNode
}

export function CrudPageLayout({ title, subtitle, createLabel, table, createModal }: CrudPageLayoutProps) {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> {createLabel}
        </Button>
      </div>
      {table}
      {createModal({ open: createOpen, onClose: () => setCreateOpen(false) })}
    </div>
  )
}
