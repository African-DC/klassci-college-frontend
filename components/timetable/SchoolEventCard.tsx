"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { ScheduleEvent } from "@/lib/contracts/schedule-events"

export function SchoolEventCard({ event }: { event: ScheduleEvent }) {
  return (
    <Card className="border-dashed bg-muted/50 shadow-none">
      <CardContent className="flex items-center gap-3 p-3">
        <div className="min-w-[58px] text-center tabular-nums">
          <p className="text-xs font-bold">{event.start_time}</p>
          <p className="text-[10px] text-muted-foreground">{event.end_time}</p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{event.title}</p>
          <p className="text-xs text-muted-foreground">
            {event.blocks_courses ? "Pause ou activité sans cours" : "Activité scolaire"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
