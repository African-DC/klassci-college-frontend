"use client"

import { cn } from "@/lib/utils"
import { useTeacherTimetable } from "@/lib/hooks/useTimetable"
import type { TimetableSlot } from "@/lib/api/timetable"
import { Skeleton } from "@/components/ui/skeleton"

const DAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi"] as const
const DAY_LABELS = { lundi: "Lundi", mardi: "Mardi", mercredi: "Mercredi", jeudi: "Jeudi", vendredi: "Vendredi" }
const HOURS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"]

const SLOT_COLORS = [
  "bg-blue-50 border-blue-200 text-blue-800",
  "bg-emerald-50 border-emerald-200 text-emerald-800",
  "bg-amber-50 border-amber-200 text-amber-800",
  "bg-violet-50 border-violet-200 text-violet-800",
  "bg-rose-50 border-rose-200 text-rose-800",
]

interface TeacherScheduleViewProps {
  teacherId: number
}

export function TeacherScheduleView({ teacherId }: TeacherScheduleViewProps) {
  const { data: slots, isLoading, error } = useTeacherTimetable(teacherId)

  function getSlot(day: string, hour: string): TimetableSlot | undefined {
    return slots?.find((s) => s.day === day && s.start_time === hour)
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive">{error.message}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-6 border-b">
            <div className="p-3" />
            {DAYS.map((d) => (
              <div key={d} className="p-3 text-center">
                <Skeleton className="h-4 w-16 mx-auto" />
              </div>
            ))}
          </div>
          {HOURS.map((h) => (
            <div key={h} className="grid grid-cols-6 border-b last:border-0">
              <div className="p-3"><Skeleton className="h-4 w-12" /></div>
              {DAYS.map((d) => (
                <div key={d} className="p-2">
                  <Skeleton className="h-14 w-full rounded-lg" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="grid grid-cols-6 border-b bg-muted/30">
          <div className="p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Heure
          </div>
          {DAYS.map((day) => (
            <div key={day} className="p-3 text-center text-sm font-semibold text-foreground">
              {DAY_LABELS[day]}
            </div>
          ))}
        </div>

        {/* Grid rows */}
        {HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-6 border-b last:border-0">
            <div className="flex items-center p-3 text-sm font-mono text-muted-foreground">
              {hour}
            </div>
            {DAYS.map((day) => {
              const slot = getSlot(day, hour)
              return (
                <div key={day} className="p-1.5">
                  {slot ? (
                    <div
                      className={cn(
                        "rounded-lg border p-2",
                        SLOT_COLORS[slot.subject_id % SLOT_COLORS.length]
                      )}
                    >
                      <p className="text-xs font-semibold truncate">{slot.subject_name}</p>
                      <p className="text-[10px] opacity-75 truncate">{slot.class_name}</p>
                      {slot.room && (
                        <p className="text-[10px] opacity-60">{slot.room}</p>
                      )}
                    </div>
                  ) : (
                    <div className="h-14 rounded-lg" />
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
