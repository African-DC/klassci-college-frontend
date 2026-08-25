"use client"

import { Calendar, CalendarRange, CalendarCheck, History, CalendarClock } from "lucide-react"
import { CrudPageLayout } from "@/components/shared/CrudPageLayout"
import { type HeroKpi } from "@/components/shared/PageHero"
import { useAcademicYears } from "@/lib/hooks/useAcademicYears"
import { AcademicYearsTable } from "./AcademicYearsTable"
import { AcademicYearCreateModal } from "./AcademicYearCreateModal"

export function AcademicYearsPageClient() {
  const { data } = useAcademicYears({ size: 100 })
  const items = data?.items ?? []
  const now = Date.now()
  const current = items.find((y) => y.is_current)
  const past = items.filter((y) => !y.is_current && new Date(y.end_date).getTime() < now).length
  const upcoming = items.filter((y) => !y.is_current && new Date(y.start_date).getTime() > now).length

  const kpis: HeroKpi[] = [
    { label: "Années", value: items.length, icon: CalendarRange },
    { label: "Année courante", value: current?.name ?? "—", icon: CalendarCheck },
    { label: "Passées", value: past, icon: History },
    { label: "À venir", value: upcoming, icon: CalendarClock },
  ]

  return (
    <CrudPageLayout
      title="Annees academiques"
      subtitle="Gestion des annees scolaires et definition de l'annee courante"
      createLabel="Nouvelle annee"
      icon={Calendar}
      kpis={kpis}
      table={<AcademicYearsTable />}
      createModal={(props) => <AcademicYearCreateModal {...props} />}
    />
  )
}
