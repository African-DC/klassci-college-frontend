"use client"

import { Clock, MapPin, Pencil, UserRound } from "lucide-react"
import { cn } from "@/lib/utils"
import { SchoolEventCard } from "@/components/timetable/SchoolEventCard"
import type { TimetableSlot } from "@/lib/contracts/timetable"
import type { ScheduleEvent } from "@/lib/contracts/schedule-events"
import { formatDuration, getSlotColor, sortSlotsByTime } from "./timetable-grid-helpers"

interface TimetableMobileDayProps {
  day: string
  dayLabel: string
  slots: TimetableSlot[]
  events: ScheduleEvent[]
  onSelect: (slot: TimetableSlot) => void
}

/** La liste d'un jour sur petit écran : pauses puis créneaux, triés. */
export function TimetableMobileDay({ day, dayLabel, slots, events, onSelect }: TimetableMobileDayProps) {
  const daySlots = sortSlotsByTime(slots)
  const dayEvents = events.filter(event => event.day === day)
  if (daySlots.length === 0 && dayEvents.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
        Aucun cours planifié pour {dayLabel.toLowerCase()}.
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {dayEvents.map(event => <SchoolEventCard key={`event-${event.id}`} event={event} />)}
      {daySlots.map(slot => <MobileSlotButton key={slot.id} slot={slot} onSelect={onSelect} />)}
    </div>
  )
}

function MobileSlotButton({ slot, onSelect }: { slot: TimetableSlot; onSelect: (slot: TimetableSlot) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(slot)}
      className={cn(
        "w-full rounded-lg border p-4 text-left shadow-sm transition-colors active:scale-[0.99]",
        getSlotColor(slot.subject_color),
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{slot.subject_name}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs opacity-80">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {slot.start_time} - {slot.end_time}
            </span>
            <span>{formatDuration(slot.start_time, slot.end_time)}</span>
          </div>
        </div>
        <Pencil className="h-4 w-4 shrink-0 opacity-60" aria-hidden="true" />
      </div>
      <div className="mt-3 grid gap-1.5 text-xs opacity-75">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <UserRound className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{slot.teacher_name}</span>
        </span>
        {slot.room && (
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{slot.room}</span>
          </span>
        )}
      </div>
    </button>
  )
}
