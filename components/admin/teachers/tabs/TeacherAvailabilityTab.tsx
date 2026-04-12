"use client"

import { useCallback, useMemo } from "react"
import { Clock, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  useTeacherAvailabilities,
  useCreateAvailability,
  useDeleteAvailability,
} from "@/lib/hooks/useTimetable"
import type { DayOfWeek, TeacherAvailability } from "@/lib/contracts/timetable"

interface TeacherAvailabilityTabProps {
  teacherId: number
}

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: "monday", label: "Lundi" },
  { key: "tuesday", label: "Mardi" },
  { key: "wednesday", label: "Mercredi" },
  { key: "thursday", label: "Jeudi" },
  { key: "friday", label: "Vendredi" },
  { key: "saturday", label: "Samedi" },
]

// Time slots from 07:00 to 17:00 (1-hour blocks)
const HOURS = Array.from({ length: 10 }, (_, i) => {
  const h = 7 + i
  return {
    start: `${String(h).padStart(2, "0")}:00`,
    end: `${String(h + 1).padStart(2, "0")}:00`,
    label: `${String(h).padStart(2, "0")}h`,
  }
})

/**
 * Build a lookup map: "monday|07:00|08:00" -> availability id
 * so we can quickly check if a cell is available and get its id for deletion.
 */
function buildAvailabilityMap(
  availabilities: TeacherAvailability[],
): Map<string, number> {
  const map = new Map<string, number>()
  for (const av of availabilities) {
    if (av.available) {
      map.set(`${av.day}|${av.start_time}|${av.end_time}`, av.id)
    }
  }
  return map
}

function cellKey(day: DayOfWeek, start: string, end: string) {
  return `${day}|${start}|${end}`
}

export function TeacherAvailabilityTab({
  teacherId,
}: TeacherAvailabilityTabProps) {
  const { data: availabilities, isLoading } =
    useTeacherAvailabilities(teacherId)
  const { mutate: createAvailability, isPending: creating } =
    useCreateAvailability(teacherId)
  const { mutate: deleteAvailability, isPending: deleting } =
    useDeleteAvailability(teacherId)

  const isMutating = creating || deleting

  const availabilityMap = useMemo(
    () => buildAvailabilityMap(availabilities ?? []),
    [availabilities],
  )

  const handleToggle = useCallback(
    (day: DayOfWeek, start: string, end: string) => {
      if (isMutating) return
      const key = cellKey(day, start, end)
      const existingId = availabilityMap.get(key)
      if (existingId) {
        deleteAvailability(existingId)
      } else {
        createAvailability({
          day,
          start_time: start,
          end_time: end,
          available: true,
        })
      }
    },
    [isMutating, availabilityMap, createAvailability, deleteAvailability],
  )

  if (isLoading) {
    return <AvailabilitySkeleton />
  }

  const totalSlots = availabilityMap.size
  const maxSlots = DAYS.length * HOURS.length

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Disponibilités</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-xs">
                {totalSlots}/{maxSlots} créneaux
              </Badge>
              {isMutating && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Cliquez sur une cellule pour activer ou désactiver la disponibilité.
          </p>
        </CardContent>
      </Card>

      {/* Grid */}
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
                      const key = cellKey(day.key, hour.start, hour.end)
                      const isAvailable = availabilityMap.has(key)
                      return (
                        <td key={key} className="p-1">
                          <button
                            type="button"
                            disabled={isMutating}
                            onClick={() =>
                              handleToggle(day.key, hour.start, hour.end)
                            }
                            className={`
                              w-full h-9 rounded-md transition-colors
                              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                              disabled:pointer-events-none disabled:opacity-50
                              ${
                                isAvailable
                                  ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/30 hover:bg-emerald-500/30"
                                  : "bg-muted/40 text-muted-foreground/50 hover:bg-muted/70"
                              }
                            `}
                            aria-label={`${day.label} ${hour.start}-${hour.end}: ${isAvailable ? "disponible" : "indisponible"}`}
                          >
                            {isAvailable ? "Dispo" : ""}
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

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-5 rounded-sm bg-emerald-500/20 ring-1 ring-emerald-500/30" />
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-5 rounded-sm bg-muted/40" />
          <span>Indisponible</span>
        </div>
      </div>
    </div>
  )
}

function AvailabilitySkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16 rounded-lg" />
      <Skeleton className="h-[400px] rounded-lg" />
    </div>
  )
}
