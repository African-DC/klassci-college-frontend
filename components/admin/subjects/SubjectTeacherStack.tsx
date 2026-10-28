"use client"

import { UserX } from "lucide-react"
import type { SubjectTeacher } from "@/lib/contracts/subject"
import { teacherInitials } from "@/lib/utils/subject-colors"

interface Props {
  teachers: SubjectTeacher[]
  accentClass: string
}

const MAX_AVATARS = 3

/** Enseignants d'une matière : avatars initiales (3 au plus, puis +N) et noms qui passent à la ligne. */
export function SubjectTeacherStack({ teachers, accentClass }: Props) {
  if (teachers.length === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
        <UserX className="h-3 w-3" aria-hidden />
        Non assigné
      </span>
    )
  }

  const visible = teachers.slice(0, MAX_AVATARS)
  const hidden = teachers.length - visible.length

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex -space-x-2">
        {visible.map((teacher) => (
          <span
            key={teacher.id}
            className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white ring-2 ring-background ${accentClass}`}
            aria-hidden
          >
            {teacherInitials(teacher.full_name)}
          </span>
        ))}
        {hidden > 0 && (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground ring-2 ring-background">
            +{hidden}
          </span>
        )}
      </div>
      <p className="break-words text-sm leading-snug">{teachers.map((t) => t.full_name).join(", ")}</p>
    </div>
  )
}
