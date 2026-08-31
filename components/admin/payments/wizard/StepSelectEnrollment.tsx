"use client"

import { useMemo } from "react"
import { BookOpen, ChevronRight, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useEnrollments } from "@/lib/hooks/useEnrollments"
import type { Enrollment } from "@/lib/contracts/enrollment"
import type { Student } from "@/lib/contracts/student"

/**
 * L'inscription à créditer. Une carte par inscription, cliquable en entier :
 * la cible tactile est la carte, pas une puce de 16 pixels.
 */
export function StepSelectEnrollment({
  student,
  onSelect,
}: {
  student: Student
  onSelect: (enrollment: Enrollment) => void
}) {
  const { data, isLoading } = useEnrollments({ student_id: student.id })
  const enrollments = useMemo(() => data?.items ?? [], [data])

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <p className="text-xs text-muted-foreground">Élève sélectionné</p>
        <p className="font-medium">
          {student.last_name} {student.first_name}
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="sr-only">Chargement des inscriptions</span>
        </div>
      )}

      {!isLoading && enrollments.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Aucune inscription trouvée pour cet élève.
        </p>
      )}

      {enrollments.length > 0 && (
        <ul className="space-y-2" role="list">
          {enrollments.map((enrollment) => (
            <li key={enrollment.id}>
              <button
                type="button"
                onClick={() => onSelect(enrollment)}
                className="flex min-h-11 w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <BookOpen className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {enrollment.class_name ?? `Classe #${enrollment.class_id}`}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {enrollment.academic_year_name}
                  </span>
                </span>
                <Badge
                  variant={enrollment.status === "valide" ? "default" : "secondary"}
                  className="shrink-0"
                >
                  {enrollment.status}
                </Badge>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
