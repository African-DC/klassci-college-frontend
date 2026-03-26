"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useStudentTimetable } from "@/lib/hooks/useStudentPortal"
import type { TimetableSlot } from "@/lib/contracts/timetable"

const DAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi"] as const
const DAY_LABELS: Record<string, string> = {
  lundi: "Lun",
  mardi: "Mar",
  mercredi: "Mer",
  jeudi: "Jeu",
  vendredi: "Ven",
}

// Couleurs par matière pour différencier visuellement
const SUBJECT_COLORS = [
  "bg-blue-50 border-blue-200 text-blue-800",
  "bg-emerald-50 border-emerald-200 text-emerald-800",
  "bg-amber-50 border-amber-200 text-amber-800",
  "bg-purple-50 border-purple-200 text-purple-800",
  "bg-rose-50 border-rose-200 text-rose-800",
  "bg-cyan-50 border-cyan-200 text-cyan-800",
  "bg-orange-50 border-orange-200 text-orange-800",
  "bg-indigo-50 border-indigo-200 text-indigo-800",
]

function getSubjectColor(subjectId: number): string {
  return SUBJECT_COLORS[subjectId % SUBJECT_COLORS.length]
}

export function StudentTimetableClient() {
  const { data: slots, isLoading } = useStudentTimetable()

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

      {isLoading ? (
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
