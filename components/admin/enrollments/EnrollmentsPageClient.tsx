"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ClipboardList, GraduationCap, Plus, ListChecks, CheckCircle2, Clock, XCircle } from "lucide-react"
import Link from "next/link"
import type { Route } from "next"
import { PageHero, heroAccentBtn, heroGlassBtn, type HeroKpi } from "@/components/shared/PageHero"
import { EnrollmentsTable } from "./EnrollmentsTable"
import { EnrollmentCreateModal } from "./EnrollmentCreateModal"
import { useAdminSummary } from "@/lib/hooks/useDashboard"
import { useCurrentAcademicYearId } from "@/lib/hooks/useCurrentAcademicYear"
import type { AdminSummary } from "@/lib/contracts/dashboard"

function useEnrollmentsKpis(data: AdminSummary | undefined): HeroKpi[] {
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

// Le bandeau, le sous-titre et la liste parlent de la même année : mêlées
// toutes années, les compteurs annonçaient un total introuvable ailleurs.
function EnrollmentsSubtitle({ total, yearName }: { total: number | undefined; yearName: string | undefined }) {
  if (total == null || !yearName) {
    return <span>Gérez les inscriptions des élèves</span>
  }
  if (total === 0) {
    return <span>Aucune inscription en {yearName}</span>
  }
  return (
    <span>
      {total} inscription{total > 1 ? "s" : ""} en {yearName}
    </span>
  )
}

export function EnrollmentsPageClient() {
  const searchParams = useSearchParams()
  const [createOpen, setCreateOpen] = useState(false)
  const [preselectedStudentId, setPreselectedStudentId] = useState<number | undefined>(undefined)
  const [pickedYearId, setPickedYearId] = useState<number | undefined>(undefined)
  const { academicYearId, years } = useCurrentAcademicYearId(pickedYearId)
  const yearName = years?.find((y) => y.id === academicYearId)?.name
  const { data: summary } = useAdminSummary(academicYearId)
  const kpis = useEnrollmentsKpis(summary)

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
        subtitle={<EnrollmentsSubtitle total={summary?.enrollments.total} yearName={yearName} />}
        actions={
          <>
            {/*
              La porte de la saisie en lot. Elle est ici parce que c'est d'ici
              qu'on constate qu'il reste des dossiers a renseigner, et parce
              qu'une fonctionnalite qu'on ne trouve pas n'existe pas.
            */}
            <Link href={"/admin/enrollments/saisie-classe" as Route} className={heroGlassBtn}>
              <ClipboardList className="h-4 w-4" />
              Saisie par classe
            </Link>
            <button type="button" className={heroAccentBtn} onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Nouvelle inscription
            </button>
          </>
        }
        kpis={kpis}
      />

      <EnrollmentsTable pickedYearId={pickedYearId} onPickYear={setPickedYearId} />

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
