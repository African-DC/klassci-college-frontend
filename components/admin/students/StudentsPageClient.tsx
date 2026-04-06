"use client"

import { CrudPageLayout } from "@/components/shared/CrudPageLayout"
import { StudentsTable } from "./StudentsTable"
import { StudentCreateModal } from "./StudentCreateModal"

export function StudentsPageClient() {
  return (
    <CrudPageLayout
      title="Élèves"
      subtitle="Gestion des élèves inscrits"
      createLabel="Nouvel élève"
      table={<StudentsTable />}
      createModal={(props) => <StudentCreateModal {...props} />}
    />
  )
}
