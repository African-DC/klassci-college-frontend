"use client"

import { BookOpen, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { CrudPageLayout } from "@/components/shared/CrudPageLayout"
import { TeachersTable } from "./TeachersTable"
import { TeacherCreateModal } from "./TeacherCreateModal"
import { useTeachers } from "@/lib/hooks/useTeachers"

function TeacherKpis() {
  const { data } = useTeachers({ size: 1 })
  const total = data?.total ?? 0

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Enseignants</p>
            <p className="text-xl font-bold">{total}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
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
