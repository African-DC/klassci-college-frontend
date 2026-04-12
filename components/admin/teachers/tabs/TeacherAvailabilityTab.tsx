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

// 07:00 to 18:00 (12 slots)
const HOURS = Array.from({ length: 11 }, (_, i) => {
  const h = 7 + i
  return {
    start: `${String(h).padStart(2, "0")}:00`,
    end: `${String(h + 1).padStart(2, "0")}:00`,
    label: `${String(h).padStart(2, "0")}h`,
  }
})

// 3 states: unavailable (default), available, preferred
type CellState = "unavailable" | "available" | "preferred"

function buildAvailabilityMap(
  availabilities: TeacherAvailability[],
): Map<string, { id: number; available: boolean }> {
  const map = new Map<string, { id: number; available: boolean }>()
  for (const av of availabilities) {
    map.set(`${av.day}|${av.start_time}|${av.end_time}`, {
      id: av.id,
      available: av.available,
    })
  }
  return map
}

function cellKey(day: DayOfWeek, start: string, end: string) {
  return `${day}|${start}|${end}`
}

const STATE_STYLES: Record<CellState, string> = {
  unavailable:
    "bg-rose-500/15 text-rose-600 ring-1 ring-rose-300/40 hover:bg-rose-500/25",
  available:
    "bg-emerald-500/20 text-emerald-700 ring-1 ring-emerald-500/30 hover:bg-emerald-500/30",
  preferred:
    "bg-primary/15 text-primary ring-1 ring-primary/30 hover:bg-primary/25",
}

const STATE_LABELS: Record<CellState, string> = {
  unavailable: "",
  available: "Dispo",
  preferred: "Préféré",
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

  function getCellState(day: DayOfWeek, start: string, end: string): CellState {
    const entry = availabilityMap.get(cellKey(day, start, end))
    if (!entry) return "unavailable"
    // available=true → "available", we'll use a convention: if it has available=true it's available
    // For "preferred", we'd need another field, but for now we cycle: unavailable → available → preferred → unavailable
    return entry.available ? "available" : "unavailable"
  }

  const handleToggle = useCallback(
    (day: DayOfWeek, start: string, end: string) => {
      if (isMutating) return
      const key = cellKey(day, start, end)
      const existing = availabilityMap.get(key)

      if (!existing) {
        // unavailable → available
        createAvailability({ day, start_time: start, end_time: end, available: true })
      } else {
        // available → delete (back to unavailable)
        deleteAvailability(existing.id)
      }
    },
    [isMutating, availabilityMap, createAvailability, deleteAvailability],
  )

  if (isLoading) {
    return <AvailabilitySkeleton />
  }

  const totalAvailable = Array.from(availabilityMap.values()).filter(
    (v) => v.available,
  ).length
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
                {totalAvailable}/{maxSlots} créneaux disponibles
              </Badge>
              {isMutating && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Cliquez sur une cellule pour basculer entre disponible et indisponible.
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
                      const state = getCellState(day.key, hour.start, hour.end)
                      return (
                        <td key={cellKey(day.key, hour.start, hour.end)} className="p-1">
                          <button
                            type="button"
                            disabled={isMutating}
                            onClick={() =>
                              handleToggle(day.key, hour.start, hour.end)
                            }
                            className={`
                              w-full h-9 rounded-md text-[10px] font-medium transition-colors
                              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                              disabled:pointer-events-none disabled:opacity-50
                              ${STATE_STYLES[state]}
                            `}
                            aria-label={`${day.label} ${hour.start}-${hour.end}: ${state}`}
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

      {/* Legend */}
      <div className="flex items-center gap-5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-5 rounded-sm bg-emerald-500/20 ring-1 ring-emerald-500/30" />
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-5 rounded-sm bg-primary/15 ring-1 ring-primary/30" />
          <span>Créneaux préférés</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-5 rounded-sm bg-rose-500/15 ring-1 ring-rose-300/40" />
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
      <Skeleton className="h-[450px] rounded-lg" />
    </div>
  )
}
