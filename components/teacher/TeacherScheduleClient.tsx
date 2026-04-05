"use client"

import { TeacherScheduleView } from "@/components/teacher/timetable/TeacherScheduleView"

interface TeacherScheduleClientProps {
  teacherId: number
}

export function TeacherScheduleClient({ teacherId }: TeacherScheduleClientProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-xl tracking-tight">Mon emploi du temps</h1>
        <p className="text-sm text-muted-foreground">Votre planning de la semaine</p>
      </div>
      <TeacherScheduleView teacherId={teacherId} />
    </div>
  )
}
