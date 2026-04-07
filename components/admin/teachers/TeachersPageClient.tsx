"use client"

import { BookOpen } from "lucide-react"
import { CrudPageLayout } from "@/components/shared/CrudPageLayout"
import { TeachersTable } from "./TeachersTable"
import { TeacherCreateModal } from "./TeacherCreateModal"

export function TeachersPageClient() {
  return (
    <CrudPageLayout
      title="Enseignants"
      subtitle="Gestion du corps enseignant"
      createLabel="Nouvel enseignant"
      icon={BookOpen}
      table={<TeachersTable />}
      createModal={(props) => <TeacherCreateModal {...props} />}
    />
  )
}
