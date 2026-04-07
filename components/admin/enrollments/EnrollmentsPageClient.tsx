"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Plus, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EnrollmentsTable } from "./EnrollmentsTable"
import { EnrollmentCreateModal } from "./EnrollmentCreateModal"

export function EnrollmentsPageClient() {
  const searchParams = useSearchParams()
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setCreateOpen(true)
    }
  }, [searchParams])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-2xl tracking-tight">Inscriptions</h1>
            <p className="text-sm text-muted-foreground">
              Gérez les inscriptions des élèves
            </p>
          </div>
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
