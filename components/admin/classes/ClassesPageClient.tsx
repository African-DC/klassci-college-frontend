"use client"

import { School } from "lucide-react"
import { CrudPageLayout } from "@/components/shared/CrudPageLayout"
import { ClassesTable } from "./ClassesTable"
import { ClassCreateModal } from "./ClassCreateModal"

export function ClassesPageClient() {
  return (
    <CrudPageLayout
      title="Classes"
      subtitle="Gestion des classes et niveaux"
      createLabel="Nouvelle classe"
      icon={School}
      table={<ClassesTable />}
      createModal={(props) => <ClassCreateModal {...props} />}
    />
  )
}
