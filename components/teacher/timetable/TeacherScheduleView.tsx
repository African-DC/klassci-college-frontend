"use client"

import { cn } from "@/lib/utils"
import { useTeacherTimetable } from "@/lib/hooks/useTimetable"
import type { TimetableSlot } from "@/lib/contracts/timetable"
import { Skeleton } from "@/components/ui/skeleton"

const DAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"] as const
const DAY_LABELS: Record<string, string> = {
  lundi: "Lundi",
  mardi: "Mardi",
  mercredi: "Mercredi",
  jeudi: "Jeudi",
  vendredi: "Vendredi",
  samedi: "Samedi",
}

const START_HOUR = 7
const END_HOUR = 18
const PX_PER_HOUR = 60

const SLOT_COLORS = [
  "bg-blue-50 border-blue-200 text-blue-800",
  "bg-emerald-50 border-emerald-200 text-emerald-800",
  "bg-amber-50 border-amber-200 text-amber-800",
  "bg-violet-50 border-violet-200 text-violet-800",
  "bg-rose-50 border-rose-200 text-rose-800",
  "bg-cyan-50 border-cyan-200 text-cyan-800",
  "bg-orange-50 border-orange-200 text-orange-800",
  "bg-indigo-50 border-indigo-200 text-indigo-800",
]

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

interface TeacherScheduleViewProps {
  teacherId: number
}

export function TeacherScheduleView({ teacherId }: TeacherScheduleViewProps) {
  const { data: slots, isLoading, error } = useTeacherTimetable(teacherId)

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
        <div className="min-w-[900px]">
          <div className="grid grid-cols-7 border-b">
            <div className="p-3" />
            {DAYS.map((d) => (
              <div key={d} className="p-3 text-center">
                <Skeleton className="h-4 w-16 mx-auto" />
              </div>
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid grid-cols-7 border-b last:border-0">
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

  const totalHeight = (END_HOUR - START_HOUR) * PX_PER_HOUR

  // Group slots by day
  const slotsByDay: Record<string, TimetableSlot[]> = {}
  for (const day of DAYS) {
    slotsByDay[day] = (slots ?? [])
      .filter((s) => s.day === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  }

  // Generate hour labels
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)

  return (
    <div className="rounded-lg border bg-card overflow-x-auto">
      <div className="min-w-[900px]">
        {/* Header */}
        <div className="grid grid-cols-7 border-b bg-muted/30">
          <div className="p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Heure
          </div>
          {DAYS.map((day) => (
            <div key={day} className="p-3 text-center text-sm font-semibold text-foreground">
              {DAY_LABELS[day]}
            </div>
          ))}
        </div>

        {/* Grid body — absolute positioning like admin grid */}
        <div className="grid grid-cols-7">
          {/* Hour labels column */}
          <div className="relative" style={{ height: totalHeight }}>
            {hours.map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0 flex items-start px-3 text-xs font-mono text-muted-foreground"
                style={{ top: (h - START_HOUR) * PX_PER_HOUR }}
              >
                <span className="mt-[-7px]">{`${String(h).padStart(2, "0")}:00`}</span>
              </div>
            ))}
            {/* Hour lines */}
            {hours.map((h) => (
              <div
                key={`line-${h}`}
                className="absolute left-0 right-0 border-t border-border/40"
                style={{ top: (h - START_HOUR) * PX_PER_HOUR }}
              />
            ))}
          </div>

          {/* Day columns */}
          {DAYS.map((day) => (
            <div key={day} className="relative border-l border-border/30" style={{ height: totalHeight }}>
              {/* Hour lines */}
              {hours.map((h) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-t border-border/40"
                  style={{ top: (h - START_HOUR) * PX_PER_HOUR }}
                />
              ))}
              {/* Slots */}
              {slotsByDay[day].map((slot) => {
                const startMin = timeToMinutes(slot.start_time) - START_HOUR * 60
                const endMin = timeToMinutes(slot.end_time) - START_HOUR * 60
                const top = (startMin / 60) * PX_PER_HOUR
                const height = ((endMin - startMin) / 60) * PX_PER_HOUR - 2

                return (
                  <div
                    key={slot.id}
                    className={cn(
                      "absolute left-1 right-1 rounded-md border px-2 py-1 overflow-hidden",
                      SLOT_COLORS[slot.subject_id % SLOT_COLORS.length]
                    )}
                    style={{ top: top + 1, height: Math.max(height, 20) }}
                  >
                    <p className="text-xs font-semibold truncate">{slot.subject_name}</p>
                    {height > 30 && (
                      <p className="text-[10px] opacity-75 truncate">{slot.class_name}</p>
                    )}
                    {height > 45 && slot.room && (
                      <p className="text-[10px] opacity-60 truncate">{slot.room}</p>
                    )}
                    {height > 55 && (
                      <p className="text-[9px] opacity-50">{slot.start_time} - {slot.end_time}</p>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
