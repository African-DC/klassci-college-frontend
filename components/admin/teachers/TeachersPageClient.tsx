"use client"

import { useMemo } from "react"
import { BookOpen, Users, Award, Phone, UserX } from "lucide-react"
import { CrudPageLayout } from "@/components/shared/CrudPageLayout"
import { KpiStrip, type KpiItem } from "@/components/shared/list/KpiStrip"
import { TeachersTable } from "./TeachersTable"
import { TeacherCreateModal } from "./TeacherCreateModal"
import { useTeachers } from "@/lib/hooks/useTeachers"

function TeacherKpis() {
  const { data } = useTeachers({ size: 100 })
  const kpis: KpiItem[] = useMemo(() => {
    const items = data?.items ?? []
    const total = data?.total ?? items.length
    const withSpeciality = items.filter((t) => t.speciality?.trim()).length
    const withPhone = items.filter((t) => t.phone?.trim()).length
    const withoutSpeciality = items.length - withSpeciality
    return [
      { label: "Enseignants", value: total, icon: Users, tone: "primary" },
      { label: "Avec spécialité", value: withSpeciality, icon: Award, tone: "default" },
      { label: "Avec téléphone", value: withPhone, icon: Phone, tone: "default" },
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
