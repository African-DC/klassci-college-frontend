"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SubjectsTable } from "./SubjectsTable"
import { SubjectCreateModal } from "./SubjectCreateModal"

export function SubjectsPageClient() {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl tracking-tight">Matières</h1>
          <p className="text-sm text-muted-foreground">Gestion des matières enseignées</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle matière
        </Button>
      </div>

      <SubjectsTable />

      <SubjectCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
