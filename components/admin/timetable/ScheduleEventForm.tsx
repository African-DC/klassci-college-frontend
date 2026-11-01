"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useInfiniteClasses } from "@/lib/hooks/useClasses"
import { dayLabelFr } from "@/lib/timetable/days"
import {
  DAYS, EVENT_CATEGORIES, EVENT_LABELS, ScheduleEventCreateSchema,
  type ScheduleEvent, type ScheduleEventCreate,
} from "@/lib/contracts/schedule-events"

function initial(yearId: number, classId: number | null): ScheduleEventCreate {
  return {
    academic_year_id: yearId, class_id: classId, title: "Récréation",
    category: "recess", blocks_courses: true, day: "lundi",
    start_time: "10:00", end_time: "10:15",
  }
}

function fromEvent(event: ScheduleEvent): ScheduleEventCreate {
  return {
    academic_year_id: event.academic_year_id, class_id: event.class_id,
    title: event.title, category: event.category,
    blocks_courses: event.blocks_courses, day: event.day,
    start_time: event.start_time, end_time: event.end_time,
  }
}

interface ScheduleEventFormProps {
  yearId: number
  classId: number | null
  editing: ScheduleEvent | null
  isBusy: boolean
  onCancel: () => void
  onSubmit: (values: ScheduleEventCreate, days: ScheduleEventCreate["day"][]) => Promise<void>
}

export function ScheduleEventForm({ yearId, classId, editing, isBusy, onCancel, onSubmit }: ScheduleEventFormProps) {
  const [selectedDays, setSelectedDays] = useState<ScheduleEventCreate["day"][]>(
    editing ? [editing.day] : [...DAYS.slice(0, 5)],
  )
  const { data: classes, scrollInfini } = useInfiniteClasses({ size: 100 })
  const form = useForm<ScheduleEventCreate>({
    resolver: zodResolver(ScheduleEventCreateSchema),
    defaultValues: editing ? fromEvent(editing) : initial(yearId, classId),
  })

  async function submit(values: ScheduleEventCreate) {
    if (!editing && selectedDays.length === 0) {
      form.setError("day", { message: "Sélectionnez au moins un jour." })
      return
    }
    await onSubmit(values, selectedDays)
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="event-title">Intitulé</Label>
          <Input id="event-title" className="h-11 sm:h-9" {...form.register("title")} />
          {form.formState.errors.title && <p role="alert" className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={form.watch("category")} onValueChange={v => {
            const category = v as ScheduleEventCreate["category"]
            form.setValue("category", category, { shouldValidate: true })
            if (!editing) form.setValue("title", EVENT_LABELS[category])
          }}>
            <SelectTrigger className="h-11 sm:h-9" aria-label="Type de période"><SelectValue /></SelectTrigger>
            <SelectContent>{EVENT_CATEGORIES.map(k => <SelectItem key={k} value={k}>{EVENT_LABELS[k]}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{editing ? "Jour" : "Jours de récurrence"}</Label>
          {editing ? (
            <Select value={form.watch("day")} onValueChange={v =>
              form.setValue("day", v as ScheduleEventCreate["day"], { shouldValidate: true })}>
              <SelectTrigger className="h-11 sm:h-9" aria-label="Jour de la période"><SelectValue /></SelectTrigger>
              <SelectContent>{DAYS.map(day =>
                <SelectItem key={day} value={day}>{dayLabelFr(day)}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex flex-wrap gap-x-3 gap-y-2 rounded-lg border p-3">
              {DAYS.map(day => (
                <label key={day} className="flex min-h-11 items-center gap-2 text-xs sm:min-h-0">
                  <Checkbox
                    checked={selectedDays.includes(day)}
                    onCheckedChange={checked => {
                      setSelectedDays(previous => checked
                        ? [...previous, day].filter((value, index, values) => values.indexOf(value) === index)
                        : previous.filter(value => value !== day))
                    }}
                  />
                  {dayLabelFr(day)}
                </label>
              ))}
            </div>
          )}
          {!editing && selectedDays.length === 0 &&
            <p role="alert" className="text-xs text-destructive">Choisissez au moins un jour.</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="event-start">Début</Label>
          <Input id="event-start" type="time" className="h-11 sm:h-9" {...form.register("start_time")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="event-end">Fin</Label>
          <Input id="event-end" type="time" className="h-11 sm:h-9" {...form.register("end_time")} />
          {form.formState.errors.end_time && <p role="alert" className="text-xs text-destructive">{form.formState.errors.end_time.message}</p>}
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Portée</Label>
          <Select value={form.watch("class_id")?.toString() ?? "school"} onValueChange={v => form.setValue("class_id", v === "school" ? null : Number(v), { shouldValidate: true })}>
            <SelectTrigger className="h-11 sm:h-9" aria-label="Classes concernées"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="school">Tout l'établissement</SelectItem>
              {(classes?.items ?? []).map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {scrollInfini.resteAcharger && (
            <Button type="button" size="sm" variant="ghost" className="h-11 sm:h-9"
              disabled={scrollInfini.chargeEnCours}
              onClick={scrollInfini.chargerSuite}>
              {scrollInfini.chargeEnCours ? "Chargement…" : "Afficher les classes suivantes"}
            </Button>
          )}
        </div>
      </div>
      <label className="flex min-h-11 items-center gap-3 rounded-lg border p-3 text-sm">
        <Checkbox checked={form.watch("blocks_courses")} onCheckedChange={value => form.setValue("blocks_courses", value === true)} />
        Empêcher les cours pendant cette période
      </label>
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" className="h-11 sm:h-9" onClick={onCancel}>Retour</Button>
        <Button type="submit" className="h-11 sm:h-9" disabled={isBusy}>Enregistrer</Button>
      </div>
    </form>
  )
}
