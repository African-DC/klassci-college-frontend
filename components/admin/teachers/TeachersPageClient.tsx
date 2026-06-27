"use client"

import { useMemo } from "react"
import { BookOpen, Users, Award, Phone, UserX } from "lucide-react"
import { CrudPageLayout } from "@/components/shared/CrudPageLayout"
import { KpiStrip, type KpiItem } from "@/components/shared/list/KpiStrip"
import { TeachersTable } from "./TeachersTable"
import { TeacherCreateModal } from "./TeacherCreateModal"
import { useAdminSummary } from "@/lib/hooks/useDashboard"

function TeacherKpis() {
  const { data } = useAdminSummary()
  const kpis: KpiItem[] = useMemo(() => {
    const t = data?.teachers
    const withoutSpeciality = t?.without_speciality ?? 0
    return [
      { label: "Enseignants", value: t?.total ?? 0, icon: Users, tone: "primary" },
      { label: "Avec spécialité", value: t?.with_speciality ?? 0, icon: Award, tone: "default" },
      { label: "Avec téléphone", value: t?.with_phone ?? 0, icon: Phone, tone: "default" },
      { label: "Sans spécialité", value: withoutSpeciality, icon: UserX, tone: withoutSpeciality > 0 ? "accent" : "default" },
    ]
  }, [data])
  return <KpiStrip items={kpis} />
}

export function TeachersPageClient() {
  return (
    <CrudPageLayout
      title="Enseignants"
      subtitle="Gestion du corps enseignant"
      createLabel="Nouvel enseignant"
      icon={BookOpen}
      kpiCards={<TeacherKpis />}
      table={<TeachersTable />}
      createModal={(props) => <TeacherCreateModal {...props} />}
    />
  )
}
