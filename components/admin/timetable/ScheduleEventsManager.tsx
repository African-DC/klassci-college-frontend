"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarClock, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useAcademicYears } from "@/lib/hooks/useAcademicYears"
import { useInfiniteClasses } from "@/lib/hooks/useClasses"
import { durationLabel } from "@/lib/timetable/durations"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { useScheduleEventMutations, useScheduleEvents } from "@/lib/hooks/useScheduleEvents"
import {
  DAYS, EVENT_CATEGORIES, EVENT_LABELS, ScheduleEventCreateSchema,
  type ScheduleEvent, type ScheduleEventCreate,
} from "@/lib/contracts/schedule-events"

const DAY_NAMES: Record<string, string> = {
  lundi: "Lundi", mardi: "Mardi", mercredi: "Mercredi",
  jeudi: "Jeudi", vendredi: "Vendredi", samedi: "Samedi",
}

function initial(yearId: number, classId: number | null = null): ScheduleEventCreate {
  return {
    academic_year_id: yearId, class_id: classId, title: "Récréation",
    category: "recess", blocks_courses: true, day: "lundi",
    start_time: "10:00", end_time: "10:15",
  }
}

export function ScheduleEventsManager({ classId }: { classId?: number | null }) {
  const [opened, setOpened] = useState(false)
  const [editing, setEditing] = useState<ScheduleEvent | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [pendingDeletion, setPendingDeletion] = useState<number | null>(null)
  const { data: years } = useAcademicYears()
  const yearId = years?.items.find(y => y.is_current)?.id ?? null
  const { data: classes, scrollInfini } = useInfiniteClasses({ size: 50 })
  const { has } = usePermissions()
  const canRead = has("timetable:read")
  const canWrite = has("timetable:write")
  const { data: events, isLoading, isError, refetch } =
    useScheduleEvents(opened && canRead ? yearId : null, classId ?? undefined)
  const actions = useScheduleEventMutations()
  const form = useForm<ScheduleEventCreate>({
    resolver: zodResolver(ScheduleEventCreateSchema),
    defaultValues: initial(yearId ?? 0, classId ?? null),
  })
  const isBusy = actions.create.isPending || actions.update.isPending || actions.remove.isPending
  function begin(event?: ScheduleEvent) {
    setEditing(event ?? null)
    form.reset(event ? {
      academic_year_id: event.academic_year_id, class_id: event.class_id,
      title: event.title, category: event.category,
      blocks_courses: event.blocks_courses, day: event.day,
      start_time: event.start_time, end_time: event.end_time,
    } : initial(yearId ?? 0, classId ?? null))
    setShowForm(true)
  }
  async function submit(values: ScheduleEventCreate) {
    try {
      if (editing) await actions.update.mutateAsync({ id: editing.id, data: values })
      else await actions.create.mutateAsync(values)
      toast.success(editing ? "Activité modifiée" : "Activité ajoutée")
      setShowForm(false)
      setEditing(null)
    } catch (error) {
      toast.error("Enregistrement impossible", {
        description: error instanceof Error ? error.message : "Vérifiez les horaires et les cours existants.",
      })
    }
  }
  async function remove() {
    if (pendingDeletion === null) return
    try {
      await actions.remove.mutateAsync(pendingDeletion)
      toast.success("Activité supprimée")
      setPendingDeletion(null)
    } catch (error) {
      toast.error("Suppression impossible", { description: error instanceof Error ? error.message : "" })
    }
  }

  if (!canRead) return null
  return (
    <>
      <Button type="button" variant="outline" className="min-h-11 sm:min-h-10"
        onClick={() => setOpened(true)}>
        <CalendarClock className="mr-2 h-4 w-4" aria-hidden="true" />
        Pauses et activités
      </Button>
      <Dialog open={opened} onOpenChange={v => { if (!v) { setShowForm(false); setPendingDeletion(null) } setOpened(v) }}>
        <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rythme scolaire et séances spéciales</DialogTitle>
            <DialogDescription>
              Les pauses bloquantes sont exclues des cours et de leur génération.
              Les horaires s'appliquent chaque semaine de l'année scolaire.
            </DialogDescription>
          </DialogHeader>
          {!yearId ? <p role="status" className="text-sm text-muted-foreground">Configurez d'abord l'année scolaire en cours.</p>
          : !showForm ? (
            <div className="space-y-3">
              {canWrite && <Button type="button" onClick={() => begin()}>
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Ajouter une période
              </Button>}
              {isLoading ? <Skeleton className="h-24 w-full" />
              : isError ? <Button variant="outline" onClick={() => refetch()}>Réessayer</Button>
              : !events?.length ? <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">Aucune période définie.</p>
              : <div className="space-y-2">
                {events.map(event => (
                  <Card key={event.id} className="shadow-none">
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {DAY_NAMES[event.day]} · {event.start_time}–{event.end_time} ({durationLabel(event.start_time, event.end_time)}) · {event.class_id === null ? "Tout l'établissement" : classes?.items.find(c => c.id === event.class_id)?.name ?? "Classe"} · {event.blocks_courses ? "Bloque les cours" : "Activité informative"}
                        </p>
                      </div>
                      {canWrite && <div className="flex items-center gap-1">
                        <Button type="button" variant="outline" size="icon" aria-label={`Modifier ${event.title}`} onClick={() => begin(event)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" aria-label={`Supprimer ${event.title}`} onClick={() => setPendingDeletion(event.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>}
                    </CardContent>
                  </Card>
                ))}
              </div>}
              {pendingDeletion !== null && <div role="alertdialog" aria-label="Confirmer la suppression" className="rounded-lg border p-3">
                <p className="mb-3 text-sm">Supprimer définitivement cette période ?</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setPendingDeletion(null)}>Annuler</Button>
                  <Button variant="destructive" disabled={isBusy} onClick={remove}>Confirmer</Button>
                </div>
              </div>}
            </div>
          ) : <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="event-title">Intitulé</Label>
                <Input id="event-title" {...form.register("title")} />
                {form.formState.errors.title && <p role="alert" className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.watch("category")} onValueChange={v => {
                  const category = v as ScheduleEventCreate["category"]
                  form.setValue("category", category, { shouldValidate: true })
                  if (!editing) form.setValue("title", EVENT_LABELS[category])
                }}>
                  <SelectTrigger aria-label="Type de période"><SelectValue /></SelectTrigger>
                  <SelectContent>{EVENT_CATEGORIES.map(k => <SelectItem key={k} value={k}>{EVENT_LABELS[k]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Jour</Label>
                <Select value={form.watch("day")} onValueChange={v => form.setValue("day", v as ScheduleEventCreate["day"], { shouldValidate: true })}>
                  <SelectTrigger aria-label="Jour de la période"><SelectValue /></SelectTrigger>
                  <SelectContent>{DAYS.map(day => <SelectItem key={day} value={day}>{DAY_NAMES[day]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="event-start">Début</Label>
                <Input id="event-start" type="time" {...form.register("start_time")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="event-end">Fin</Label>
                <Input id="event-end" type="time" {...form.register("end_time")} />
                {form.formState.errors.end_time && <p role="alert" className="text-xs text-destructive">{form.formState.errors.end_time.message}</p>}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Portée</Label>
                <Select value={form.watch("class_id")?.toString() ?? "school"} onValueChange={v => form.setValue("class_id", v === "school" ? null : Number(v), { shouldValidate: true })}>
                  <SelectTrigger aria-label="Classes concernées"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="school">Tout l'établissement</SelectItem>
                    {(classes?.items ?? []).map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {scrollInfini.resteAcharger && (
                  <Button type="button" size="sm" variant="ghost"
                    disabled={scrollInfini.chargeEnCours}
                    onClick={scrollInfini.chargerSuite}>
                    {scrollInfini.chargeEnCours ? "Chargement…" : "Afficher les classes suivantes"}
                  </Button>
                )}
              </div>
            </div>
            <label className="flex items-center gap-3 rounded-lg border p-3 text-sm">
              <Checkbox checked={form.watch("blocks_courses")} onCheckedChange={value => form.setValue("blocks_courses", value === true)} />
              Empêcher les cours pendant cette période
            </label>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Retour</Button>
              <Button type="submit" disabled={isBusy}>Enregistrer</Button>
            </div>
          </form>}
        </DialogContent>
      </Dialog>
    </>
  )
}
