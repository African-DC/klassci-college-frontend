"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TeachersTable } from "./TeachersTable"
import { TeacherCreateModal } from "./TeacherCreateModal"

export function TeachersPageClient() {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl tracking-tight">Enseignants</h1>
          <p className="text-sm text-muted-foreground">Gestion du corps enseignant</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvel enseignant
        </Button>
      </div>

      <TeachersTable />

      <TeacherCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
