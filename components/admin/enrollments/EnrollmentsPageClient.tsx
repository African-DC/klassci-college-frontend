"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { GraduationCap, Plus, ListChecks, CheckCircle2, Clock, XCircle } from "lucide-react"
import { PageHero, heroAccentBtn, type HeroKpi } from "@/components/shared/PageHero"
import { EnrollmentsTable } from "./EnrollmentsTable"
import { EnrollmentCreateModal } from "./EnrollmentCreateModal"
import { useEnrollments } from "@/lib/hooks/useEnrollments"
import { useAdminSummary } from "@/lib/hooks/useDashboard"

function useEnrollmentsKpis(): HeroKpi[] {
  const { data } = useAdminSummary()
  return useMemo(() => {
    const e = data?.enrollments
    return [
      { label: "Inscriptions", value: e?.total ?? 0, icon: ListChecks },
      { label: "Validées", value: e?.valid ?? 0, icon: CheckCircle2 },
      { label: "À valider", value: e?.pending ?? 0, icon: Clock },
      { label: "Rejetées / annulées", value: e?.closed ?? 0, icon: XCircle },
    ]
  }, [data])
}

// Subtitle informatif sans redondance avec les chips. Le total renseigne
// l'admin sur la volumétrie de la queue ; les counts par statut sont sur
// la chips bar juste en dessous.
function EnrollmentsSubtitle() {
  const { data, isLoading } = useEnrollments({ size: 1 })
  if (isLoading || !data) {
    return <span>Gérez les inscriptions des élèves</span>
  }
  const total = data.total ?? 0
  if (total === 0) {
    return <span>Aucune inscription pour le moment</span>
  }
  return (
    <span>
      {total} inscription{total > 1 ? "s" : ""} au total
    </span>
  )
}

export function EnrollmentsPageClient() {
  const searchParams = useSearchParams()
  const [createOpen, setCreateOpen] = useState(false)
  const [preselectedStudentId, setPreselectedStudentId] = useState<number | undefined>(undefined)
  const kpis = useEnrollmentsKpis()

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
      <PageHero
        icon={GraduationCap}
        title="Inscriptions"
        subtitle={<EnrollmentsSubtitle />}
        actions={
          <button type="button" className={heroAccentBtn} onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Nouvelle inscription
          </button>
        }
        kpis={kpis}
      />

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
