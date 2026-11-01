"use client"

import { Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DataError } from "@/components/shared/DataError"
import { useInfiniteClasses } from "@/lib/hooks/useClasses"
import { dayLabelFr } from "@/lib/timetable/days"
import { durationLabel } from "@/lib/timetable/durations"
import type { ScheduleEvent } from "@/lib/contracts/schedule-events"

interface ScheduleEventsListProps {
  events: ScheduleEvent[] | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  canWrite: boolean
  onRetry: () => void
  onAdd: () => void
  onEdit: (event: ScheduleEvent) => void
  onDelete: (id: number) => void
}

export function ScheduleEventsList({
  events, isLoading, isError, error, canWrite, onRetry, onAdd, onEdit, onDelete,
}: ScheduleEventsListProps) {
  const { data: classes } = useInfiniteClasses({ size: 100 })
  const classLabel = (classId: number | null) =>
    classId === null ? "Tout l'établissement" : classes?.items.find(c => c.id === classId)?.name ?? "Classe"

  return (
    <div className="space-y-3">
      {canWrite && <Button type="button" className="h-11 sm:h-9" onClick={onAdd}>
        <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Ajouter une période
      </Button>}
      {isLoading ? <Skeleton className="h-24 w-full" />
      : isError ? <DataError compact message="Impossible de charger les pauses." error={error} onRetry={onRetry} />
      : !events?.length ? <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">Aucune période définie.</p>
      : <div className="space-y-2">
        {events.map(event => (
          <Card key={event.id} className="shadow-none">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{event.title}</p>
                <p className="text-xs text-muted-foreground">
                  {dayLabelFr(event.day)} · {event.start_time}–{event.end_time} ({durationLabel(event.start_time, event.end_time)}) · {classLabel(event.class_id)} · {event.blocks_courses ? "Bloque les cours" : "Activité informative"}
                </p>
              </div>
              {canWrite && <div className="flex items-center gap-1">
                <Button type="button" variant="outline" size="icon" className="h-11 w-11 sm:h-9 sm:w-9" aria-label={`Modifier ${event.title}`} onClick={() => onEdit(event)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-11 w-11 sm:h-9 sm:w-9" aria-label={`Supprimer ${event.title}`} onClick={() => onDelete(event.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>}
            </CardContent>
          </Card>
        ))}
      </div>}
    </div>
  )
}
