"use client"

import { BookOpen, Users, Award, Phone, UserX } from "lucide-react"
import { CrudPageLayout } from "@/components/shared/CrudPageLayout"
import { type HeroKpi } from "@/components/shared/PageHero"
import { TeachersTable } from "./TeachersTable"
import { TeacherCreateModal } from "./TeacherCreateModal"
import { useAdminSummary } from "@/lib/hooks/useDashboard"

export function TeachersPageClient() {
  const { data } = useAdminSummary()
  const t = data?.teachers
  const kpis: HeroKpi[] = [
    { label: "Enseignants", value: t?.total ?? 0, icon: Users },
    { label: "Avec spécialité", value: t?.with_speciality ?? 0, icon: Award },
    { label: "Avec téléphone", value: t?.with_phone ?? 0, icon: Phone },
    { label: "Sans spécialité", value: t?.without_speciality ?? 0, icon: UserX },
  ]

  return (
    <CrudPageLayout
      title="Enseignants"
      subtitle="Gestion du corps enseignant"
      createLabel="Nouvel enseignant"
      icon={BookOpen}
      kpis={kpis}
      table={<TeachersTable />}
      createModal={(props) => <TeacherCreateModal {...props} />}
    />
  )
}
