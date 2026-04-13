"use client"

import { Users, UserCheck, User } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { CrudPageLayout } from "@/components/shared/CrudPageLayout"
import { StudentsTable } from "./StudentsTable"
import { StudentCreateModal } from "./StudentCreateModal"
import { useStudents } from "@/lib/hooks/useStudents"

function StudentKpis() {
  const { data } = useStudents({ size: 1 })
  const { data: boys } = useStudents({ genre: "M", size: 1 })
  const { data: girls } = useStudents({ genre: "F", size: 1 })

  const total = data?.total ?? 0
  const totalBoys = boys?.total ?? 0
  const totalGirls = girls?.total ?? 0

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl font-bold">{total}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Garçons</p>
            <p className="text-xl font-bold">{totalBoys}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100">
            <UserCheck className="h-4 w-4 text-rose-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Filles</p>
            <p className="text-xl font-bold">{totalGirls}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function StudentsPageClient() {
  return (
    <CrudPageLayout
      title="Élèves"
      subtitle="Gestion des élèves inscrits"
      createLabel="Nouvel élève"
      icon={Users}
      kpiCards={<StudentKpis />}
      table={<StudentsTable />}
      createModal={(props) => <StudentCreateModal {...props} />}
    />
  )
}
