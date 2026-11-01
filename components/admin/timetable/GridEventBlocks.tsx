"use client"

import type { ScheduleEvent } from "@/lib/contracts/schedule-events"
import { durationLabel } from "@/lib/timetable/durations"
import { enMinutesStrict } from "./timetable-grid-helpers"
import { PX_PAR_HEURE } from "@/lib/timetable/semaine"

interface GridEventBlocksProps {
  events: ScheduleEvent[]
  gridMinutesEnPx: (minute: number) => number
}

/** Les pauses et activités d'une colonne de jour, posées sur l'axe des minutes. */
export function GridEventBlocks({ events, gridMinutesEnPx }: GridEventBlocksProps) {
  return (
    <>
      {events.map(event => {
        const start = enMinutesStrict(event.start_time)
        const end = enMinutesStrict(event.end_time)
        return (
          <div key={`event-${event.id}`}
            title={`${event.title} · ${event.start_time}–${event.end_time}`}
            className="pointer-events-none absolute left-1 right-1 z-10 flex items-center justify-center overflow-hidden rounded-md border border-dashed bg-amber-100/90 px-1 text-center text-[10px] font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-100"
            style={{ top: gridMinutesEnPx(start) + 1, height: Math.max(4, (end - start) * PX_PAR_HEURE / 60 - 2) }}>
            <span className="truncate" aria-label={`${event.title} de ${event.start_time} à ${event.end_time} (${durationLabel(event.start_time, event.end_time)})`}>
              {end - start < 28 ? `${event.start_time}–${event.end_time}` : `${event.title} · ${event.start_time}–${event.end_time}`}
            </span>
          </div>
        )
      })}
    </>
  )
}
