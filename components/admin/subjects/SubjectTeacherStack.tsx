"use client"

import { UserX } from "lucide-react"
import { teacherInitials } from "@/lib/utils/subject-colors"

interface Props {
  names: string[]
  accentClass: string
}

const MAX_AVATARS = 3

/** Enseignants d'une matière : avatars initiales (3 au plus, puis +N) et noms qui passent à la ligne. */
export function SubjectTeacherStack({ names, accentClass }: Props) {
  if (names.length === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
        <UserX className="h-3 w-3" aria-hidden />
        Non assigné
      </span>
    )
  }

  const visible = names.slice(0, MAX_AVATARS)
  const hidden = names.length - visible.length

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex items-center">
        <div className="flex -space-x-2">
          {visible.map((name) => (
            <span
              key={name}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white ring-2 ring-background ${accentClass}`}
              aria-hidden
            >
              {teacherInitials(name)}
            </span>
          ))}
          {hidden > 0 && (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground ring-2 ring-background">
              +{hidden}
            </span>
          )}
        </div>
      </div>
      <p className="break-words text-sm leading-snug">{names.join(", ")}</p>
    </div>
  )
}
