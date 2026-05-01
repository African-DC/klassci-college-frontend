"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { GraduationCap, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EnrollmentsTable } from "./EnrollmentsTable"
import { EnrollmentCreateModal } from "./EnrollmentCreateModal"
import { useEnrollments } from "@/lib/hooks/useEnrollments"

// Subtitle informatif sans redondance avec les chips. Le total renseigne
// l'admin sur la volumétrie de la queue ; les counts par statut sont sur
// la chips bar juste en dessous.
function EnrollmentsSubtitle() {
  const { data, isLoading } = useEnrollments({ size: 1 })
  if (isLoading || !data) {
    return <p className="text-sm text-muted-foreground">Gérez les inscriptions des élèves</p>
  }
  const total = data.total ?? 0
  if (total === 0) {
    return <p className="text-sm text-muted-foreground">Aucune inscription pour le moment</p>
  }
  return (
    <p className="text-sm text-muted-foreground">
      {total} inscription{total > 1 ? "s" : ""} au total
    </p>
  )
}

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="font-serif text-xl tracking-tight sm:text-2xl">Inscriptions</h1>
            <EnrollmentsSubtitle />
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="h-11 gap-2 sm:h-10">
          <Plus className="h-4 w-4" />
          Nouvelle inscription
        </Button>
      </div>

      <EnrollmentsTable />

      <EnrollmentCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
