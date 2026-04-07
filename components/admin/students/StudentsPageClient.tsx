"use client"

import { Users } from "lucide-react"
import { CrudPageLayout } from "@/components/shared/CrudPageLayout"
import { StudentsTable } from "./StudentsTable"
import { StudentCreateModal } from "./StudentCreateModal"

export function StudentsPageClient() {
  return (
    <CrudPageLayout
      title="Élèves"
      subtitle="Gestion des élèves inscrits"
      createLabel="Nouvel élève"
      icon={Users}
      table={<StudentsTable />}
      createModal={(props) => <StudentCreateModal {...props} />}
    />
  )
}
