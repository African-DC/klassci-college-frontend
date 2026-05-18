"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { DayOfWeek } from "@/lib/contracts/timetable"
import {
  CellState,
  DAYS,
  HOURS,
  STATE_LABELS,
  STATE_STYLES,
  cellKey,
} from "./availability-helpers"

interface AvailabilityGridProps {
  getDisplayState: (day: DayOfWeek, start: string, end: string) => CellState
  isPendingCell: (day: DayOfWeek, start: string, end: string) => boolean
  interactive: boolean
  onToggle: (day: DayOfWeek, start: string, end: string) => void
}

export function AvailabilityGrid({
  getDisplayState,
  isPendingCell,
  interactive,
  onToggle,
}: AvailabilityGridProps) {
  return (
    <Card className="border-0 shadow-sm ring-1 ring-border overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-muted/50 p-2 text-left font-medium text-muted-foreground min-w-[60px]">
                  Heure
                </th>
                {DAYS.map((d) => (
                  <th
                    key={d.key}
                    className="p-2 text-center font-medium text-muted-foreground min-w-[80px]"
                  >
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((hour) => (
                <tr key={hour.start} className="border-t border-border/50">
                  <td className="sticky left-0 z-10 bg-muted/50 p-2 font-medium text-muted-foreground tabular-nums">
                    {hour.label}
                  </td>
                  {DAYS.map((day) => {
                    const state = getDisplayState(day.key, hour.start, hour.end)
                    const isPending = isPendingCell(day.key, hour.start, hour.end)
                    return (
                      <td
                        key={cellKey(day.key, hour.start, hour.end)}
                        className="p-1"
                      >
                        <button
                          type="button"
                          disabled={!interactive}
                          onClick={() => onToggle(day.key, hour.start, hour.end)}
                          className={`
                            w-full h-9 rounded-md text-[10px] font-medium transition-colors
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                            ${interactive ? "hover:opacity-80 cursor-pointer" : "cursor-default"}
                            ${STATE_STYLES[state]}
                            ${isPending ? "ring-2 ring-dashed ring-amber-500/70" : ""}
                          `}
                          aria-label={`${day.label} ${hour.start}-${hour.end}: ${state}${
                            isPending ? " (modification en attente)" : ""
                          }`}
                        >
                          {STATE_LABELS[state]}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
