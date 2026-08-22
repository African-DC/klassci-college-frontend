"use client"

import Link from "next/link"
import type { Route } from "next"
import { CalendarCog } from "lucide-react"
import { TeacherScheduleView } from "@/components/teacher/timetable/TeacherScheduleView"
import { Button } from "@/components/ui/button"

export function TeacherScheduleClient() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl tracking-tight">Mon emploi du temps</h1>
          <p className="text-sm text-muted-foreground">Votre planning de la semaine</p>
        </div>
        <Button asChild variant="outline" className="h-11">
          <Link href={"/teacher/availabilities" as Route}>
            <CalendarCog className="h-4 w-4" aria-hidden />
            Mes disponibilités
          </Link>
        </Button>
      </div>
      {/* No teacherId prop → fetch via /teacher/schedule (JWT-resolved) */}
      <TeacherScheduleView />
    </div>
  )
}
