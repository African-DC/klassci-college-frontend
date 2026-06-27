"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { GraduationCap, Plus, ListChecks, CheckCircle2, Clock, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { KpiStrip, type KpiItem } from "@/components/shared/list/KpiStrip"
import { EnrollmentsTable } from "./EnrollmentsTable"
import { EnrollmentCreateModal } from "./EnrollmentCreateModal"
import { useEnrollments } from "@/lib/hooks/useEnrollments"
import { useAdminSummary } from "@/lib/hooks/useDashboard"

function EnrollmentsKpis() {
  const { data } = useAdminSummary()
  const kpis: KpiItem[] = useMemo(() => {
    const e = data?.enrollments
    const pending = e?.pending ?? 0
    return [
      { label: "Inscriptions", value: e?.total ?? 0, icon: ListChecks, tone: "primary" },
      { label: "Validées", value: e?.valid ?? 0, icon: CheckCircle2, tone: "emerald" },
      { label: "À valider", value: pending, icon: Clock, tone: "accent" },
      { label: "Rejetées / annulées", value: e?.closed ?? 0, icon: XCircle, tone: (e?.closed ?? 0) > 0 ? "destructive" : "default" },
    ]
  }, [data])
  return <KpiStrip items={kpis} />
}

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
  const [preselectedStudentId, setPreselectedStudentId] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      // Bug #22 : si le badge "À inscrire" passe student_id en query,
      // on l'extrait et on le file au modal pour pré-remplissage + skip step.
      const sid = searchParams.get("student_id")
      const parsed = sid ? parseInt(sid, 10) : NaN
      setPreselectedStudentId(Number.isFinite(parsed) && parsed > 0 ? parsed : undefined)
      setCreateOpen(true)
    }
  }, [searchParams])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <GraduationCap aria-hidden="true" className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-serif text-xl tracking-tight sm:text-2xl">Inscriptions</h1>
            <EnrollmentsSubtitle />
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="h-11 gap-2 sm:h-10">
          <Plus aria-hidden="true" className="h-4 w-4" />
          Nouvelle inscription
        </Button>
      </div>

      <EnrollmentsKpis />

      <EnrollmentsTable />

      <EnrollmentCreateModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false)
          setPreselectedStudentId(undefined)
        }}
        preselectedStudentId={preselectedStudentId}
      />
    </div>
  )
}
