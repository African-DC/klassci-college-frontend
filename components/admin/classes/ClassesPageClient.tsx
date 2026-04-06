"use client"

import { CrudPageLayout } from "@/components/shared/CrudPageLayout"
import { ClassesTable } from "./ClassesTable"
import { ClassCreateModal } from "./ClassCreateModal"

export function ClassesPageClient() {
  return (
    <CrudPageLayout
      title="Classes"
      subtitle="Gestion des classes et niveaux"
      createLabel="Nouvelle classe"
      table={<ClassesTable />}
      createModal={(props) => <ClassCreateModal {...props} />}
    />
  )
}
