"use client"

import { CrudPageLayout } from "@/components/shared/CrudPageLayout"
import { AcademicYearsTable } from "./AcademicYearsTable"
import { AcademicYearCreateModal } from "./AcademicYearCreateModal"

export function AcademicYearsPageClient() {
  return (
    <CrudPageLayout
      title="Annees academiques"
      subtitle="Gestion des annees scolaires et definition de l'annee courante"
      createLabel="Nouvelle annee"
      table={<AcademicYearsTable />}
      createModal={(props) => <AcademicYearCreateModal {...props} />}
    />
  )
}
