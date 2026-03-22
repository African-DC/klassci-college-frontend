"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StudentsTable } from "./StudentsTable"
import { StudentCreateModal } from "./StudentCreateModal"

export function StudentsPageClient() {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl tracking-tight">Eleves</h1>
          <p className="text-sm text-muted-foreground">Gestion des eleves inscrits</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvel eleve
        </Button>
      </div>

      <StudentsTable />

      <StudentCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
