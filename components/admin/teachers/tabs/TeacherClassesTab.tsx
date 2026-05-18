"use client"

import Link from "next/link"
import type { Route } from "next"
import {
  BookOpen,
  CalendarPlus,
  ChevronRight,
  Clock,
  GraduationCap,
  Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface TaughtClass {
  id: number
  name: string
  level?: string | null
  subjects?: string[]
  hours_per_week?: number
  student_count?: number
}

interface TeacherClassesTabProps {
  teacherId: number
  fullData?: Record<string, unknown>
}

export function TeacherClassesTab({ fullData }: TeacherClassesTabProps) {
  // BE renvoie `classes` (TeacherTaughtClass[]) aggregé depuis timetable_slots
  // pour l'AY courante : rattachement teacher↔classe implicite (cf. rule
  // klassci-subjects-catalogue-instances). Pour chaque entrée on a la liste
  // des matières enseignées par CE prof dans CETTE classe + heures/sem +
  // effectif validé AY courante.
  const classes = (fullData?.classes as TaughtClass[] | undefined) ?? []
  const isLoaded = fullData !== undefined && fullData !== null

  if (!isLoaded) {
    return (
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted/40" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-card px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
          <GraduationCap className="h-7 w-7" />
        </div>
        <div className="max-w-md space-y-1">
          <p className="font-serif text-base">Aucune classe assignée</p>
          <p className="text-sm text-muted-foreground">
            Cet enseignant n&apos;apparaît dans aucun créneau d&apos;emploi du temps
            de l&apos;année courante. Ajoutez un créneau pour l&apos;assigner à une classe.
          </p>
        </div>
        <Button asChild className="mt-2 h-10" variant="outline">
          <Link href={"/admin/timetable" as Route}>
            <CalendarPlus className="mr-2 h-4 w-4" />
            Configurer l&apos;emploi du temps
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {classes.map((cls) => (
        <ClassCard key={cls.id} cls={cls} />
      ))}
    </div>
  )
}

function ClassCard({ cls }: { cls: TaughtClass }) {
  const subjects = cls.subjects ?? []
  const studentCount = cls.student_count ?? 0
  const hours = cls.hours_per_week ?? 0

  return (
    <Link
      href={`/admin/classes/${cls.id}` as Route}
      className="group block focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
    >
      <Card className="border-0 shadow-sm ring-1 ring-border transition-all group-hover:ring-primary group-hover:shadow-md">
        <CardContent className="space-y-3 p-5">
          {/* Header — class name + chevron */}
          <div className="flex items-start justify-between">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 shrink-0 text-primary" />
                <h4 className="text-sm font-semibold truncate">{cls.name}</h4>
              </div>
              {cls.level && (
                <p className="text-xs text-muted-foreground">{cls.level}</p>
              )}
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 group-hover:text-primary" />
          </div>

          {/* Subjects enseignées par CE prof dans CETTE classe */}
          {subjects.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {subjects.map((s) => (
                <Badge
                  key={s}
                  variant="outline"
                  className="gap-1 border-primary/30 bg-primary/5 text-[10px] text-primary"
                >
                  <BookOpen className="h-3 w-3" />
                  {s}
                </Badge>
              ))}
            </div>
          )}

          {/* Footer KPIs — students + hours */}
          <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span>
                <span className="font-semibold text-foreground">{studentCount}</span> élève
                {studentCount !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>
                <span className="font-semibold text-foreground">{hours}</span> h/sem
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
