"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StaffTable } from "./StaffTable"
import { StaffCreateModal } from "./StaffCreateModal"

export function StaffPageClient() {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl tracking-tight">Personnel</h1>
          <p className="text-sm text-muted-foreground">Gestion du personnel administratif</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau personnel
        </Button>
      </div>

      <StaffTable />

      <StaffCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
