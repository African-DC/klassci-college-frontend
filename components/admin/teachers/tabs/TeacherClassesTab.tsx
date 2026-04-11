"use client"

import { GraduationCap } from "lucide-react"

interface TeacherClassesTabProps {
  teacherId: number
}

export function TeacherClassesTab({ teacherId }: TeacherClassesTabProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted mb-3">
        <GraduationCap className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">
        Les classes assignées seront affichées ici.
      </p>
    </div>
  )
}
