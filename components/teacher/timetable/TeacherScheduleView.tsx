"use client"

import { CalendarOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMyTimetable, useTeacherTimetable, useMySchoolEvents } from "@/lib/hooks/useTimetable"
import { SchoolEventCard } from "@/components/timetable/SchoolEventCard"
import type { TimetableSlot } from "@/lib/contracts/timetable"
import { Skeleton } from "@/components/ui/skeleton"
import { durationLabel } from "@/lib/timetable/durations"
import { orderedTimetableEntries } from "@/lib/timetable/entries"
import { visibleTimeLabels } from "@/lib/timetable/time-labels"
import { enMinutes } from "@/lib/timetable/semaine"
import { DataError } from "@/components/shared/DataError"

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

const timeToMinutes = (t: string): number => enMinutes(t) ?? NaN

interface TeacherScheduleViewProps {
  /**
   * Optional. When provided (admin viewing a specific teacher's schedule),
   * fetch via /timetable?teacher_id=. When omitted (the teacher viewing
   * their own schedule from /teacher/timetable), fetch via /teacher/schedule
   * which resolves the teacher from the JWT (no user_id↔teacher_id mapping
   * needed client-side).
   */
  teacherId?: number
}

export function TeacherScheduleView({ teacherId }: TeacherScheduleViewProps) {
  const useOwn = teacherId === undefined
  const ownQuery = useMyTimetable()
  const schoolEventsQuery = useMySchoolEvents(useOwn)
  const adminQuery = useTeacherTimetable(teacherId ?? 0)
  const slots = useOwn ? ownQuery.data : adminQuery.data
  const isLoading = useOwn ? ownQuery.isLoading : adminQuery.isLoading
  const error = useOwn ? ownQuery.error : adminQuery.error
  const events = useOwn ? (schoolEventsQuery.data ?? []) : []
  const eventsFailed = useOwn && schoolEventsQuery.isError

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

  const startHour = Math.min(
    START_HOUR,
    ...(slots ?? []).map(slot => Math.floor(timeToMinutes(slot.start_time) / 60)),
    ...events.map(event => Math.floor(timeToMinutes(event.start_time) / 60)),
  )
  const endHour = Math.max(
    END_HOUR,
    ...(slots ?? []).map(slot => Math.ceil(timeToMinutes(slot.end_time) / 60)),
    ...events.map(event => Math.ceil(timeToMinutes(event.end_time) / 60)),
  )
  const totalHeight = (endHour - startHour) * PX_PER_HOUR

  // Bug #37 : empty state explicite quand aucun créneau n'est encore
  // programmé pour cet enseignant. Sans ça, Mme Diallo voit une grille
  // hebdomadaire vide et pense que l'app est cassée. Tone informatif
  // (pas admin) — elle ne peut pas créer ses propres créneaux.
  const hasSlots = (slots ?? []).length > 0 || events.length > 0
  if (!hasSlots) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-card px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
          <CalendarOff className="h-7 w-7" />
        </div>
        <div className="max-w-md space-y-1">
          <p className="font-serif text-base">Aucun cours programmé</p>
          <p className="text-sm text-muted-foreground">
            Vos créneaux n&apos;ont pas encore été affectés pour cette année.
            Contactez l&apos;administration pour vérifier votre planning.
          </p>
        </div>
      </div>
    )
  }

  // Group slots by day
  const slotsByDay: Record<string, TimetableSlot[]> = {}
  for (const day of DAYS) {
    slotsByDay[day] = (slots ?? [])
      .filter((s) => s.day === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  }

  // Generate hour labels
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i)
  const timeMarks = [...(slots ?? []), ...events].flatMap(item => [
    timeToMinutes(item.start_time), timeToMinutes(item.end_time),
  ]).filter(minute => minute % 60 !== 0)

  return (
    <>
    {eventsFailed && (
      <DataError compact message="Impossible de charger les pauses." onRetry={() => schoolEventsQuery.refetch()} />
    )}
    {/* Mobile : liste jour-par-jour, plus lisible sur Itel S661 que la grille
        7 colonnes 900px qui necessite un scroll horizontal invisible. */}
    <div className="space-y-4 md:hidden">
      {DAYS.map((day) => {
        const daySlots = slotsByDay[day]
        const dayEvents = events.filter(event => event.day === day)
        if ((!daySlots || daySlots.length === 0) && dayEvents.length === 0) return null
        return (
          <div key={day}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {DAY_LABELS[day]}
            </h2>
            <div className="space-y-2">
              {orderedTimetableEntries(daySlots, dayEvents).map(entry => entry.kind === "event"
                ? <SchoolEventCard key={`event-${entry.item.id}`} event={entry.item} />
                : (
                <div
                  key={entry.item.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3",
                    SLOT_COLORS[entry.item.subject_id % SLOT_COLORS.length],
                  )}
                >
                  <div className="min-w-[58px] text-center">
                    <p className="text-xs font-bold tabular-nums">{entry.item.start_time}</p>
                    <p className="text-[10px] opacity-70 tabular-nums">{entry.item.end_time}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{entry.item.subject_name}</p>
                    <p className="text-[10px] opacity-75">{durationLabel(entry.item.start_time, entry.item.end_time)}</p>
                    <p className="truncate text-[11px] opacity-75">
                      {entry.item.class_name}
                      {entry.item.room && ` • ${entry.item.room}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>

    {/* Desktop : grille hebdo absolue 7 colonnes (900px). */}
    <div className="hidden rounded-lg border bg-card overflow-x-auto md:block">
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
                style={{ top: (h - startHour) * PX_PER_HOUR }}
              >
                <span className="mt-[-7px]">{`${String(h).padStart(2, "0")}:00`}</span>
              </div>
            ))}
            {/* Exact off-hour boundaries, when legible between hour labels. */}
            {visibleTimeLabels(timeMarks, startHour, endHour, PX_PER_HOUR).map(minute => (
              <div key={`minute-${minute}`}
                className="absolute left-0 right-0 px-1 text-[9px] font-mono text-muted-foreground"
                style={{ top: ((minute - startHour * 60) / 60) * PX_PER_HOUR - 5 }}>
                {`${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`}
              </div>
            ))}
            {/* Hour lines */}
            {hours.map((h) => (
              <div
                key={`line-${h}`}
                className="absolute left-0 right-0 border-t border-border/40"
                style={{ top: (h - startHour) * PX_PER_HOUR }}
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
                  style={{ top: (h - startHour) * PX_PER_HOUR }}
                />
              ))}
              {/* Recurring periods alongside the teacher's own course slots. */}
              {events.filter(event => event.day === day).map(event => {
                const start = timeToMinutes(event.start_time) - startHour * 60
                const end = timeToMinutes(event.end_time) - startHour * 60
                return (
                  <div key={`event-${event.id}`} title={event.title}
                    className="pointer-events-none absolute inset-x-1 z-10 overflow-hidden rounded-md border border-dashed bg-muted px-1 text-center text-xs font-semibold"
                    style={{ top: (start / 60) * PX_PER_HOUR + 1, height: Math.max(8, ((end - start) / 60) * PX_PER_HOUR - 2) }}>
                    {event.start_time}–{event.end_time} · {durationLabel(event.start_time, event.end_time)}
                  </div>
                )
              })}
              {/* Slots */}
              {slotsByDay[day].map((slot) => {
                const startMin = timeToMinutes(slot.start_time) - startHour * 60
                const endMin = timeToMinutes(slot.end_time) - startHour * 60
                const top = (startMin / 60) * PX_PER_HOUR
                const height = ((endMin - startMin) / 60) * PX_PER_HOUR - 2

                return (
                  <div
                    key={slot.id}
                    className={cn(
                      "absolute left-1 right-1 rounded-md border px-2 py-1 overflow-hidden",
                      SLOT_COLORS[slot.subject_id % SLOT_COLORS.length]
                    )}
                    style={{ top: top + 1, height: Math.max(height, 10) }}
                  >
                    <p className="text-xs font-semibold truncate">{slot.subject_name}</p>
                    <p className="text-[10px] opacity-80 truncate">{slot.start_time}–{slot.end_time} · {durationLabel(slot.start_time, slot.end_time)}</p>
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
    </>
  )
}
