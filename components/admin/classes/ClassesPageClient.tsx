"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ClassesTable } from "./ClassesTable"
import { ClassCreateModal } from "./ClassCreateModal"

export function ClassesPageClient() {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl tracking-tight">Classes</h1>
          <p className="text-sm text-muted-foreground">Gestion des classes et niveaux</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle classe
        </Button>
      </div>

      <ClassesTable />

      <ClassCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
