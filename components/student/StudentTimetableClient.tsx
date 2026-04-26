"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DataError } from "@/components/shared/DataError"
import { useStudentTimetable } from "@/lib/hooks/useStudentPortal"
import type { TimetableSlot } from "@/lib/contracts/timetable"

const DAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"] as const
const DAY_LABELS: Record<string, string> = {
  lundi: "Lun",
  mardi: "Mar",
  mercredi: "Mer",
  jeudi: "Jeu",
  vendredi: "Ven",
  samedi: "Sam",
}

// Couleurs par matière pour différencier visuellement
const SUBJECT_COLORS = [
  "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
  "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200",
  "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200",
  "bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200",
  "bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200",
  "bg-cyan-50 dark:bg-cyan-950 border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-200",
  "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200",
  "bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200",
]

function getSubjectColor(subjectId: number): string {
  return SUBJECT_COLORS[subjectId % SUBJECT_COLORS.length]
}

export function StudentTimetableClient() {
  const { data: slots, isLoading, isError, refetch } = useStudentTimetable()

  // Grouper les créneaux par jour
  const slotsByDay = DAYS.reduce((acc, day) => {
    acc[day] = (slots ?? [])
      .filter((s) => s.day === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
    return acc
  }, {} as Record<string, TimetableSlot[]>)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl tracking-tight">Emploi du temps</h1>
        <p className="text-sm text-muted-foreground">Votre planning de la semaine</p>
      </div>

      {isError ? (
        <DataError message="Impossible de charger l'emploi du temps" onRetry={() => refetch()} />
      ) : isLoading ? (
        <TimetableSkeleton />
      ) : !slots || slots.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Aucun emploi du temps disponible.
        </div>
      ) : (
        <div className="space-y-4">
          {DAYS.map((day) => {
            const daySlots = slotsByDay[day]
            if (daySlots.length === 0) return null
            return (
              <div key={day}>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  {DAY_LABELS[day]}
                </h2>
                <div className="space-y-2">
                  {daySlots.map((slot) => (
                    <Card
                      key={slot.id}
                      className={`border ${getSubjectColor(slot.subject_id)} shadow-none`}
                    >
                      <CardContent className="flex items-center gap-3 p-3">
                        <div className="text-center min-w-[50px]">
                          <p className="text-xs font-bold">{slot.start_time}</p>
                          <p className="text-[10px] text-muted-foreground">{slot.end_time}</p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">{slot.subject_name}</p>
                          <p className="text-xs opacity-75">
                            {slot.teacher_name}
                            {slot.room && ` • ${slot.room}`}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TimetableSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      ))}
    </div>
  )
}
