"use client"

import { CrudPageLayout } from "@/components/shared/CrudPageLayout"
import { SubjectsTable } from "./SubjectsTable"
import { SubjectCreateModal } from "./SubjectCreateModal"

export function SubjectsPageClient() {
  return (
    <CrudPageLayout
      title="Matières"
      subtitle="Gestion des matières enseignées"
      createLabel="Nouvelle matière"
      table={<SubjectsTable />}
      createModal={(props) => <SubjectCreateModal {...props} />}
    />
  )
}
