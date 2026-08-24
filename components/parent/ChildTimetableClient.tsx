"use client"

import { Clock, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DataError } from "@/components/shared/DataError"
import { useParentChildTimetable } from "@/lib/hooks/useParentPortal"
import type { ChildTimetableSlot } from "@/lib/api/parent-portal"
import { isEnrolledFromClassName } from "@/lib/utils/enrollment-status"

const DAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"] as const
const DAY_LABELS: Record<string, string> = {
  lundi: "Lundi",
  mardi: "Mardi",
  mercredi: "Mercredi",
  jeudi: "Jeudi",
  vendredi: "Vendredi",
  samedi: "Samedi",
}

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

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

interface ChildTimetableClientProps {
  childId: number
}

export function ChildTimetableClient({ childId }: ChildTimetableClientProps) {
  const { data, isLoading, isError, refetch } = useParentChildTimetable(childId)

  const slots = data?.slots ?? []
  const className = data?.class_name ?? ""

  const slotsByDay = DAYS.reduce((acc, day) => {
    acc[day] = slots
      .filter((s: ChildTimetableSlot) => s.day === day)
      .sort((a: ChildTimetableSlot, b: ChildTimetableSlot) => a.start_time.localeCompare(b.start_time))
    return acc
  }, {} as Record<string, ChildTimetableSlot[]>)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl tracking-tight">Emploi du temps</h1>
        <p className="text-sm text-muted-foreground">
          {className ? `Classe : ${className}` : "Planning de la semaine"}
        </p>
      </div>

      {isError ? (
        <DataError message="Impossible de charger l'emploi du temps" onRetry={() => refetch()} />
      ) : isLoading ? (
        <TimetableSkeleton />
      ) : slots.length === 0 ? (
        // Empty state désambigué : distinguer "enfant pas inscrit" vs
        // "inscrit mais aucun cours cette semaine" pour rassurer le parent.
        !isEnrolledFromClassName(className) ? (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="flex flex-col items-center py-10 text-center">
              <Clock aria-hidden="true" className="mb-3 h-10 w-10 text-amber-500" />
              <p className="text-sm font-medium text-amber-900">
                Inscription en attente
              </p>
              <p className="mt-1 text-xs text-amber-800">
                L&apos;emploi du temps apparaîtra ici une fois l&apos;inscription validée
                par l&apos;administration.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-muted/30">
            <CardContent className="flex flex-col items-center py-10 text-center">
              <Calendar aria-hidden="true" className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Aucun cours programmé cette semaine.
              </p>
              <p className="mt-1 text-xs text-muted-foreground/80">
                L&apos;administration n&apos;a pas encore publié l&apos;emploi du temps. Contactez
                le secrétariat si la situation persiste.
              </p>
            </CardContent>
          </Card>
        )
      ) : (
        <div className="space-y-4">
          {DAYS.map((day) => {
            const daySlots = slotsByDay[day]
            if (!daySlots || daySlots.length === 0) return null
            return (
              <div key={day}>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  {DAY_LABELS[day]}
                </h2>
                <div className="space-y-2">
                  {daySlots.map((slot) => (
                    <Card
                      key={slot.id}
                      className={`border ${SUBJECT_COLORS[hashCode(slot.subject_name) % SUBJECT_COLORS.length]} shadow-none`}
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
                            {slot.room_name && ` \u2022 ${slot.room_name}`}
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
