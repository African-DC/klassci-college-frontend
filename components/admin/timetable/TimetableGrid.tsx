"use client"

import { useState, useMemo } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useQueryClient } from "@tanstack/react-query"
import { useTimetable, useDeleteSlot } from "@/lib/hooks/useTimetable"
import type { TimetableSlot } from "@/lib/contracts/timetable"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TimetableSlotForm } from "@/components/forms/TimetableSlotForm"

const DAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"] as const
const DAY_LABELS: Record<string, string> = {
  lundi: "Lundi",
  mardi: "Mardi",
  mercredi: "Mercredi",
  jeudi: "Jeudi",
  vendredi: "Vendredi",
  samedi: "Samedi",
}

// Grid config
const START_HOUR = 7
const END_HOUR = 18
const TOTAL_HOURS = END_HOUR - START_HOUR // 11
const PX_PER_HOUR = 60 // pixels per hour

const COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-100 border-blue-300 text-blue-800",
  emerald: "bg-emerald-100 border-emerald-300 text-emerald-800",
  amber: "bg-amber-100 border-amber-300 text-amber-800",
  violet: "bg-violet-100 border-violet-300 text-violet-800",
  rose: "bg-rose-100 border-rose-300 text-rose-800",
  cyan: "bg-cyan-100 border-cyan-300 text-cyan-800",
  orange: "bg-orange-100 border-orange-300 text-orange-800",
  indigo: "bg-indigo-100 border-indigo-300 text-indigo-800",
  teal: "bg-teal-100 border-teal-300 text-teal-800",
  red: "bg-red-100 border-red-300 text-red-800",
  green: "bg-green-100 border-green-300 text-green-800",
  pink: "bg-pink-100 border-pink-300 text-pink-800",
}
const DEFAULT_SLOT_COLOR = "bg-slate-100 border-slate-300 text-slate-800"

function getSlotColor(subjectColor: string | null | undefined): string {
  if (!subjectColor) return DEFAULT_SLOT_COLOR
  return COLOR_MAP[subjectColor] ?? DEFAULT_SLOT_COLOR
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

function minutesToPx(minutes: number): number {
  return ((minutes - START_HOUR * 60) / 60) * PX_PER_HOUR
}

interface TimetableGridProps {
  classId: number
  weekOffset?: number
}

export function TimetableGrid({ classId, weekOffset = 0 }: TimetableGridProps) {
  const queryClient = useQueryClient()
  const { data: slots, isLoading } = useTimetable(classId, weekOffset)
  const deleteMutation = useDeleteSlot()
  const [createModal, setCreateModal] = useState<{ day: string; time: string } | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlot | null>(null)
  const [editSlot, setEditSlot] = useState<TimetableSlot | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [dragOverCell, setDragOverCell] = useState<string | null>(null)

  // Group slots by day
  const slotsByDay = useMemo(() => {
    const map = new Map<string, TimetableSlot[]>()
    DAYS.forEach((d) => map.set(d, []))
    slots?.forEach((s) => {
      const existing = map.get(s.day) ?? []
      existing.push(s)
      map.set(s.day, existing)
    })
    return map
  }, [slots])

  // Collect special time labels (non-hour boundaries where slots start/end)
  const specialTimes = useMemo(() => {
    const times = new Set<number>()
    slots?.forEach((s) => {
      const startMin = timeToMinutes(s.start_time)
      const endMin = timeToMinutes(s.end_time)
      if (startMin % 60 !== 0) times.add(startMin)
      if (endMin % 60 !== 0) times.add(endMin)
    })
    return times
  }, [slots])

  function handleDrop(targetDay: string, targetHour: string, slotId: number) {
    import("@/lib/api/timetable").then(({ timetableApi }) => {
      timetableApi.update(slotId, { day: targetDay as any, start_time: targetHour, end_time: addHour(targetHour) })
        .then(() => {
          toast.success("Créneau déplacé")
          queryClient.invalidateQueries({ queryKey: ["timetable"] })
        })
        .catch((err: Error) => toast.error("Erreur", { description: err.message }))
    })
  }

  const gridHeight = TOTAL_HOURS * PX_PER_HOUR

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="flex border-b bg-muted/30">
            <div className="w-[55px] p-2" />
            {DAYS.map((d) => (
              <div key={d} className="flex-1 p-2 text-center">
                <Skeleton className="h-4 w-16 mx-auto" />
              </div>
            ))}
          </div>
          <Skeleton className="h-[400px] m-4 rounded-lg" />
        </div>
      </div>
    )
  }

  // Build hour lines
  const hourLines: { hour: number; label: string }[] = []
  for (let h = START_HOUR; h <= END_HOUR; h++) {
    hourLines.push({ hour: h, label: `${String(h).padStart(2, "0")}:00` })
  }

  return (
    <>
      <div className="rounded-lg border bg-card overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Header */}
          <div className="flex border-b bg-muted/30">
            <div className="w-[55px] shrink-0 p-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Heure
            </div>
            {DAYS.map((day) => (
              <div key={day} className="flex-1 p-2 text-center text-sm font-semibold text-foreground">
                {DAY_LABELS[day]}
              </div>
            ))}
          </div>

          {/* Grid body — absolute positioning */}
          <div className="flex">
            {/* Time axis */}
            <div className="w-[55px] shrink-0 relative" style={{ height: gridHeight }}>
              {hourLines.map(({ hour, label }) => (
                <div
                  key={hour}
                  className="absolute right-0 left-0 flex items-center"
                  style={{ top: (hour - START_HOUR) * PX_PER_HOUR - 7 }}
                >
                  <span className="text-[10px] font-mono text-muted-foreground pl-1 pr-2 bg-card relative z-10">
                    {label}
                  </span>
                </div>
              ))}
              {/* Special time labels (e.g., 10:30) */}
              {Array.from(specialTimes).map((min) => {
                const hh = String(Math.floor(min / 60)).padStart(2, "0")
                const mm = String(min % 60).padStart(2, "0")
                return (
                  <div
                    key={min}
                    className="absolute right-0 left-0 flex items-center"
                    style={{ top: minutesToPx(min) - 5 }}
                  >
                    <span className="text-[9px] font-mono text-muted-foreground/60 pl-1 pr-2 bg-card relative z-10">
                      {hh}:{mm}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Day columns */}
            {DAYS.map((day) => {
              const daySlots = slotsByDay.get(day) ?? []
              return (
                <div
                  key={day}
                  className="flex-1 relative border-l border-border/30"
                  style={{ height: gridHeight }}
                >
                  {/* Hour lines (horizontal guides) */}
                  {hourLines.map(({ hour }) => (
                    <div
                      key={hour}
                      className="absolute left-0 right-0 border-t border-border/40"
                      style={{ top: (hour - START_HOUR) * PX_PER_HOUR }}
                    />
                  ))}

                  {/* Half-hour lines (dotted) */}
                  {hourLines.slice(0, -1).map(({ hour }) => (
                    <div
                      key={`${hour}-30`}
                      className="absolute left-0 right-0 border-t border-border/15 border-dashed"
                      style={{ top: (hour - START_HOUR) * PX_PER_HOUR + PX_PER_HOUR / 2 }}
                    />
                  ))}

                  {/* Free slot "+" buttons — visible in gaps between existing slots */}
                  {(() => {
                    // Compute occupied ranges for this day
                    const occupied = daySlots
                      .map((s) => ({ start: timeToMinutes(s.start_time), end: timeToMinutes(s.end_time) }))
                      .sort((a, b) => a.start - b.start)

                    // Generate "+" buttons for each free hour-aligned segment
                    const buttons: React.ReactNode[] = []
                    for (let hour = START_HOUR; hour < END_HOUR; hour++) {
                      const hourStart = hour * 60
                      const hourEnd = (hour + 1) * 60

                      // Find the actual free start within this hour (after any overlapping slot)
                      let freeStart = hourStart
                      for (const occ of occupied) {
                        if (occ.start < hourEnd && occ.end > hourStart) {
                          // This slot overlaps with this hour
                          freeStart = Math.max(freeStart, occ.end)
                        }
                      }

                      // If there's free space in this hour
                      if (freeStart < hourEnd) {
                        const freeHeight = ((hourEnd - freeStart) / 60) * PX_PER_HOUR
                        const freeTop = minutesToPx(freeStart)
                        const freeTimeStr = `${String(Math.floor(freeStart / 60)).padStart(2, "0")}:${String(freeStart % 60).padStart(2, "0")}`

                        // Only show "+" if there's enough space (at least 20px)
                        if (freeHeight >= 20) {
                          buttons.push(
                            <button
                              key={`free-${hour}`}
                              type="button"
                              className="absolute left-1 right-1 z-0 flex items-center justify-center rounded-lg border border-dashed border-muted-foreground/20 text-muted-foreground/30 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary/50"
                              style={{ top: freeTop + 1, height: freeHeight - 2 }}
                              onClick={() => setCreateModal({ day, time: freeTimeStr })}
                              onDragOver={(e) => {
                                e.preventDefault()
                                e.dataTransfer.dropEffect = "move"
                                setDragOverCell(`${day}:${hour}`)
                              }}
                              onDragLeave={() => setDragOverCell(null)}
                              onDrop={(e) => {
                                e.preventDefault()
                                setDragOverCell(null)
                                const slotId = Number(e.dataTransfer.getData("slotId"))
                                if (slotId) handleDrop(day, freeTimeStr, slotId)
                              }}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>,
                          )
                        }
                      }
                    }
                    return buttons
                  })()}

                  {/* Rendered slots */}
                  {daySlots.map((slot) => {
                    const startMin = timeToMinutes(slot.start_time)
                    const endMin = timeToMinutes(slot.end_time)
                    const top = minutesToPx(startMin)
                    const height = ((endMin - startMin) / 60) * PX_PER_HOUR
                    const showTeacher = height >= 40
                    const showRoom = height >= 55
                    const showTime = height >= 70

                    return (
                      <button
                        key={slot.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("slotId", String(slot.id))
                          e.dataTransfer.effectAllowed = "move"
                        }}
                        onClick={() => setSelectedSlot(slot)}
                        className={cn(
                          "absolute left-1 right-1 z-10 rounded-lg border p-1.5 text-left transition-shadow hover:shadow-md cursor-grab active:cursor-grabbing overflow-hidden",
                          getSlotColor(slot.subject_color)
                        )}
                        style={{ top: top + 1, height: height - 2 }}
                      >
                        <p className="text-xs font-semibold truncate leading-tight">{slot.subject_name}</p>
                        {showTeacher && <p className="text-[10px] opacity-75 truncate">{slot.teacher_name}</p>}
                        {showRoom && slot.room && <p className="text-[10px] opacity-60 truncate">{slot.room}</p>}
                        {showTime && <p className="text-[10px] opacity-50">{slot.start_time} - {slot.end_time}</p>}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Create modal */}
      <Dialog open={createModal !== null} onOpenChange={() => setCreateModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter un créneau</DialogTitle>
          </DialogHeader>
          <TimetableSlotForm
            defaultDay={createModal?.day}
            defaultStartTime={createModal?.time}
            classId={classId}
            onSuccess={() => setCreateModal(null)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit modal */}
      <Dialog open={editSlot !== null} onOpenChange={() => setEditSlot(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier le créneau</DialogTitle>
          </DialogHeader>
          {editSlot && (
            <TimetableSlotForm
              slot={editSlot}
              onSuccess={() => setEditSlot(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Slot detail modal */}
      <Dialog open={selectedSlot !== null} onOpenChange={() => setSelectedSlot(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{selectedSlot?.subject_name}</DialogTitle>
          </DialogHeader>
          {selectedSlot && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Enseignant</span>
                <span className="font-medium">{selectedSlot.teacher_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Classe</span>
                <span className="font-medium">{selectedSlot.class_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Horaire</span>
                <span className="font-medium">
                  {DAY_LABELS[selectedSlot.day]} {selectedSlot.start_time} - {selectedSlot.end_time}
                </span>
              </div>
              {selectedSlot.room && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Salle</span>
                  <span className="font-medium">{selectedSlot.room}</span>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDeleteId(selectedSlot?.id ?? null)
                setSelectedSlot(null)
              }}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditSlot(selectedSlot)
                setSelectedSlot(null)
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer le créneau</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Voulez-vous continuer ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Annuler</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deleteId) {
                  deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) })
                }
              }}
            >
              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function addHour(time: string): string {
  const [h, m] = time.split(":").map(Number)
  return `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}
