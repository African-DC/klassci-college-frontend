"use client"

import { useRouter } from "next/navigation"
import { Users, UserCheck, User, Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StudentsTable } from "./StudentsTable"
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
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-2xl tracking-tight">Élèves</h1>
            <p className="text-sm text-muted-foreground">Gestion des élèves inscrits</p>
          </div>
        </div>
        <Button onClick={() => router.push("/admin/enrollments?action=create")}>
          <Plus className="mr-2 h-4 w-4" /> Nouvelle inscription
        </Button>
      </div>
      <StudentKpis />
      <StudentsTable />
    </div>
  )
}
