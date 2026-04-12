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
const HOURS = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"]

// Color mapping from DB subject_color to Tailwind classes
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

  const slotMap = useMemo(() => {
    const map = new Map<string, TimetableSlot>()
    slots?.forEach((s) => map.set(`${s.day}:${s.start_time}`, s))
    return map
  }, [slots])

  function getSlot(day: string, hour: string): TimetableSlot | undefined {
    return slotMap.get(`${day}:${hour}`)
  }

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
          {HOURS.map((h) => (
            <div key={h} className="grid grid-cols-7 border-b last:border-0">
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

  return (
    <>
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

          {/* Grid rows */}
          {HOURS.map((hour) => (
            <div key={hour} className="grid grid-cols-7 border-b last:border-0">
              <div className="flex items-center p-3 text-sm font-mono text-muted-foreground">
                {hour}
              </div>
              {DAYS.map((day) => {
                const slot = getSlot(day, hour)
                const cellKey = `${day}:${hour}`
                const isDragOver = dragOverCell === cellKey

                return (
                  <div
                    key={day}
                    className={`p-1.5 transition-colors ${isDragOver && !slot ? "bg-primary/10" : ""}`}
                    onDragOver={(e) => {
                      if (!slot) {
                        e.preventDefault()
                        e.dataTransfer.dropEffect = "move"
                        setDragOverCell(cellKey)
                      }
                    }}
                    onDragLeave={() => setDragOverCell(null)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setDragOverCell(null)
                      const slotId = Number(e.dataTransfer.getData("slotId"))
                      if (slotId && !slot) {
                        handleDrop(day, hour, slotId)
                      }
                    }}
                  >
                    {slot ? (
                      <button
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("slotId", String(slot.id))
                          e.dataTransfer.effectAllowed = "move"
                        }}
                        onClick={() => setSelectedSlot(slot)}
                        className={cn(
                          "w-full rounded-lg border p-2 text-left transition-shadow hover:shadow-md cursor-grab active:cursor-grabbing",
                          getSlotColor(slot.subject_color)
                        )}
                      >
                        <p className="text-xs font-semibold truncate">{slot.subject_name}</p>
                        <p className="text-[10px] opacity-75 truncate">{slot.teacher_name}</p>
                        {slot.room && (
                          <p className="text-[10px] opacity-60">{slot.room}</p>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => setCreateModal({ day, time: hour })}
                        className={cn(
                          "flex h-14 w-full items-center justify-center rounded-lg border border-dashed transition-colors",
                          isDragOver
                            ? "border-primary/60 bg-primary/10 text-primary/60"
                            : "border-muted-foreground/20 text-muted-foreground/30 hover:border-primary/40 hover:bg-primary/5 hover:text-primary/50"
                        )}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
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
