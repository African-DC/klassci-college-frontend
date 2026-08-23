"use client"

import { useState, useMemo } from "react"
import { CalendarDays, Clock, MapPin, Pencil, Plus, Trash2, UserRound } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TimetableSlotForm } from "@/components/forms/TimetableSlotForm"
import { EcranTropPetit } from "@/components/forms/timetable-slot/EcranTropPetit"
import {
  HEURE_DEBUT,
  HEURE_FIN,
  JOURS,
  JOURS_NOMS,
  PX_PAR_HEURE,
  enMinutes,
  minutesEnPx,
} from "@/lib/timetable/semaine"
import { complement } from "@/lib/timetable/occupation"

/** Une heure illisible ne doit pas se dessiner a minuit : on la saute. */
const enMinutesStrict = (t: string): number => {
  const m = enMinutes(t)
  if (m === null) throw new Error(`Heure illisible : ${t}`)
  return m
}

/** Les deux grilles partagent leur echelle et leurs conversions. */


// Cette grille stocke ses jours en francais ; la source unique les porte aussi.
const DAYS = JOURS.map((j) => JOURS_NOMS[j].fr)
const DAY_LABELS: Record<string, string> = Object.fromEntries(
  JOURS.map((j) => [JOURS_NOMS[j].fr, JOURS_NOMS[j].long]),
)

// Geometrie partagee avec la semaine de l'enseignant : les deux grilles se
// lisent cote a cote, elles doivent avoir la meme echelle.
const TOTAL_HOURS = HEURE_FIN - HEURE_DEBUT

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



function sortSlotsByTime(slots: TimetableSlot[]): TimetableSlot[] {
  return [...slots].sort((a, b) => enMinutesStrict(a.start_time) - enMinutesStrict(b.start_time))
}

function formatDuration(start: string, end: string): string {
  const minutes = enMinutesStrict(end) - enMinutesStrict(start)
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours > 0 && rest > 0) return `${hours}h${String(rest).padStart(2, "0")}`
  if (hours > 0) return `${hours}h`
  return `${rest} min`
}

interface TimetableGridProps {
  classId: number
}

export function TimetableGrid({ classId }: TimetableGridProps) {
  const queryClient = useQueryClient()
  const { data: slots, isLoading } = useTimetable(classId)
  const deleteMutation = useDeleteSlot()
  const [createModal, setCreateModal] = useState<{ day: string; time: string; endTime?: string } | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlot | null>(null)
  const [editSlot, setEditSlot] = useState<TimetableSlot | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [, setDragOverCell] = useState<string | null>(null)

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
      const startMin = enMinutesStrict(s.start_time)
      const endMin = enMinutesStrict(s.end_time)
      if (startMin % 60 !== 0) times.add(startMin)
      if (endMin % 60 !== 0) times.add(endMin)
    })
    return times
  }, [slots])

  function handleDrop(targetDay: string, targetHour: string, slotId: number) {
    import("@/lib/api/timetable").then(({ timetableApi }) => {
      timetableApi.update(slotId, { day: targetDay as never, start_time: targetHour, end_time: addHour(targetHour) })
        .then(() => {
          toast.success("Créneau déplacé")
          queryClient.invalidateQueries({ queryKey: ["timetable"] })
        })
        .catch((err: Error) => toast.error("Erreur", { description: err.message }))
    })
  }

  const gridHeight = TOTAL_HOURS * PX_PAR_HEURE

  if (isLoading) {
    return (
      <>
        <div className="space-y-3 lg:hidden">
          <div className="flex gap-2 overflow-hidden">
            {DAYS.slice(0, 4).map((d) => (
              <Skeleton key={d} className="h-11 w-24 shrink-0 rounded-lg" />
            ))}
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-3 h-5 w-44" />
              <Skeleton className="mt-2 h-4 w-32" />
            </div>
          ))}
        </div>
        <div className="hidden rounded-lg border bg-card overflow-x-auto lg:block">
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
      </>
    )
  }

  // Build hour lines
  const hourLines: { hour: number; label: string }[] = []
  for (let h = HEURE_DEBUT; h <= HEURE_FIN; h++) {
    hourLines.push({ hour: h, label: `${String(h).padStart(2, "0")}:00` })
  }

  const totalSlots = slots?.length ?? 0

  function renderMobileSlot(slot: TimetableSlot) {
    return (
      <button
        key={slot.id}
        type="button"
        onClick={() => setSelectedSlot(slot)}
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

  function renderMobileDay(day: string) {
    const daySlots = sortSlotsByTime(slotsByDay.get(day) ?? [])
    if (daySlots.length === 0) {
      return (
        <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
          Aucun cours planifié pour {DAY_LABELS[day].toLowerCase()}.
        </div>
      )
    }
    return <div className="space-y-3">{daySlots.map(renderMobileSlot)}</div>
  }

  return (
    <>
      <div className="space-y-3 lg:hidden">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarDays className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Vue mobile de consultation</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {totalSlots} créneau{totalSlots > 1 ? "x" : ""} cette semaine. Ajouter ou modifier un créneau demande une tablette ou un ordinateur : il faut voir la semaine de l&apos;enseignant pendant qu&apos;on choisit l&apos;heure.
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="lundi" className="space-y-3">
          <div className="-mx-1 overflow-x-auto px-1 pb-1">
            <TabsList className="h-11 w-max max-w-none">
              {DAYS.map((day) => (
                <TabsTrigger key={day} value={day} className="h-9 min-w-20">
                  {DAY_LABELS[day].slice(0, 3)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {DAYS.map((day) => (
            <TabsContent key={day} value={day} className="mt-0">
              {renderMobileDay(day)}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <div className="hidden rounded-lg border bg-card overflow-x-auto lg:block">
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
                  style={{ top: (hour - HEURE_DEBUT) * PX_PAR_HEURE - 7 }}
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
                    style={{ top: minutesEnPx(min) - 5 }}
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
                      style={{ top: (hour - HEURE_DEBUT) * PX_PAR_HEURE }}
                    />
                  ))}

                  {/* Half-hour lines (dotted) */}
                  {hourLines.slice(0, -1).map(({ hour }) => (
                    <div
                      key={`${hour}-30`}
                      className="absolute left-0 right-0 border-t border-border/15 border-dashed"
                      style={{ top: (hour - HEURE_DEBUT) * PX_PAR_HEURE + PX_PAR_HEURE / 2 }}
                    />
                  ))}

                  {/* Free slot "+" buttons — one per free sub-segment within each hour */}
                  {(() => {
                    const occupied = daySlots
                      .map((s) => ({ start: enMinutesStrict(s.start_time), end: enMinutesStrict(s.end_time) }))
                      .sort((a, b) => a.start - b.start)

                    const buttons: React.ReactNode[] = []
                    for (let hour = HEURE_DEBUT; hour < HEURE_FIN; hour++) {
                      const hourStart = hour * 60
                      const hourEnd = (hour + 1) * 60

                      // Les trous libres de cette heure. Meme soustraction
                      // d'intervalles que la semaine de l'enseignant : ecrite
                      // une fois, testee une fois.
                      const segments = complement(
                        occupied.map((o) => ({ debut: o.start, fin: o.end })),
                        { debut: hourStart, fin: hourEnd },
                      ).map((i) => ({ start: i.debut, end: i.fin }))

                      // Render a "+" for each free sub-segment
                      for (const seg of segments) {
                        const freeHeight = ((seg.end - seg.start) / 60) * PX_PAR_HEURE
                        if (freeHeight < 12) continue

                        const freeTop = minutesEnPx(seg.start)
                        const startStr = `${String(Math.floor(seg.start / 60)).padStart(2, "0")}:${String(seg.start % 60).padStart(2, "0")}`
                        const endStr = `${String(Math.floor(seg.end / 60)).padStart(2, "0")}:${String(seg.end % 60).padStart(2, "0")}`

                        buttons.push(
                          <button
                            key={`free-${seg.start}`}
                            type="button"
                            className="absolute left-1 right-1 z-0 flex items-center justify-center rounded-lg border border-dashed border-muted-foreground/20 text-muted-foreground/30 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary/50"
                            style={{ top: freeTop + 1, height: freeHeight - 2 }}
                            onClick={() => setCreateModal({ day, time: startStr, endTime: endStr })}
                            onDragOver={(e) => {
                              e.preventDefault()
                              e.dataTransfer.dropEffect = "move"
                              setDragOverCell(`${day}:${seg.start}`)
                            }}
                            onDragLeave={() => setDragOverCell(null)}
                            onDrop={(e) => {
                              e.preventDefault()
                              setDragOverCell(null)
                              const slotId = Number(e.dataTransfer.getData("slotId"))
                              if (slotId) handleDrop(day, startStr, slotId)
                            }}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>,
                        )
                      }
                    }
                    return buttons
                  })()}

                  {/* Rendered slots */}
                  {daySlots.map((slot) => {
                    const startMin = enMinutesStrict(slot.start_time)
                    const endMin = enMinutesStrict(slot.end_time)
                    const top = minutesEnPx(startMin)
                    const height = ((endMin - startMin) / 60) * PX_PAR_HEURE
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
                          "absolute left-1 right-1 z-10 rounded-lg border p-2 text-left transition-shadow hover:shadow-md cursor-grab active:cursor-grabbing overflow-hidden",
                          getSlotColor(slot.subject_color)
                        )}
                        style={{ top: top + 1, height: height - 2 }}
                      >
                        <p className="text-xs font-semibold truncate">{slot.subject_name}</p>
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
        <DialogContent className="sm:max-w-2xl lg:max-w-6xl xl:max-w-7xl">
          <DialogHeader>
            <DialogTitle>Ajouter un créneau</DialogTitle>
          </DialogHeader>
          {/* En dessous de md, on ne pose pas de creneau : on ne verrait pas
              la semaine de l'enseignant pendant qu'on choisit l'heure. */}
          <div className="md:hidden">
            <EcranTropPetit />
          </div>
          <div className="hidden md:block">
            <TimetableSlotForm
              defaultDay={createModal?.day}
              defaultStartTime={createModal?.time}
              defaultEndTime={createModal?.endTime}
              classId={classId}
              onSuccess={() => setCreateModal(null)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit modal */}
      <Dialog open={editSlot !== null} onOpenChange={() => setEditSlot(null)}>
        <DialogContent className="sm:max-w-2xl lg:max-w-6xl xl:max-w-7xl">
          <DialogHeader>
            <DialogTitle>Modifier le créneau</DialogTitle>
          </DialogHeader>
          <div className="md:hidden">
            <EcranTropPetit />
          </div>
          {editSlot && (
            <div className="hidden md:block">
              <TimetableSlotForm slot={editSlot} onSuccess={() => setEditSlot(null)} />
            </div>
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
