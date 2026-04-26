"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Plus, GraduationCap, Users, CheckCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EnrollmentsTable } from "./EnrollmentsTable"
import { EnrollmentCreateModal } from "./EnrollmentCreateModal"
import { useEnrollments } from "@/lib/hooks/useEnrollments"

function EnrollmentKpis() {
  const { data } = useEnrollments({ size: 1 })
  const { data: validated } = useEnrollments({ status: "valide", size: 1 })
  const { data: pending } = useEnrollments({ status: "en_validation", size: 1 })

  const total = data?.total ?? 0
  const totalValidated = validated?.total ?? 0
  const totalPending = pending?.total ?? 0

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl font-bold">{total}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Validées</p>
            <p className="text-xl font-bold">{totalValidated}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">En validation</p>
            <p className="text-xl font-bold">{totalPending}</p>
          </div>
        </CardContent>
      </Card>
    </div>
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

      <EnrollmentKpis />

      <EnrollmentsTable />

      <EnrollmentCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  )
}
