"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EnrollmentsTable } from "./EnrollmentsTable"
import { EnrollmentCreateModal } from "./EnrollmentCreateModal"

export function EnrollmentsPageClient() {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inscriptions</h1>
          <p className="text-muted-foreground">
            Gerez les inscriptions des eleves
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="h-10">
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle inscription
        </Button>
      </div>

      <EnrollmentsTable />

      <EnrollmentCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  )
}
