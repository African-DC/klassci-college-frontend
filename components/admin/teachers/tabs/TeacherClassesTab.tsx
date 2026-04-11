"use client"

import { GraduationCap, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface TeacherClassesTabProps {
  teacherId: number
  fullData?: Record<string, unknown>
}

interface ClassInfo {
  id: number
  name: string
  level?: string
  student_count?: number
}

export function TeacherClassesTab({ teacherId, fullData }: TeacherClassesTabProps) {
  const classes = (fullData?.classes as ClassInfo[]) ?? []

  if (!fullData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  if (classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted mb-3">
          <GraduationCap className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Aucune classe assignée à cet enseignant.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {classes.map((cls) => (
        <Card key={cls.id} className="border-0 shadow-sm ring-1 ring-border">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold">{cls.name}</h4>
                </div>
                {cls.level && (
                  <p className="text-xs text-muted-foreground">{cls.level}</p>
                )}
              </div>
              {cls.student_count !== undefined && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span>{cls.student_count} élève{cls.student_count !== 1 ? "s" : ""}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
