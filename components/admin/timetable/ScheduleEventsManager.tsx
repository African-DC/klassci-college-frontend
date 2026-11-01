"use client"

import { useState } from "react"
import { CalendarClock } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAcademicYears } from "@/lib/hooks/useAcademicYears"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { useScheduleEventMutations, useScheduleEvents } from "@/lib/hooks/useScheduleEvents"
import type { ScheduleEvent, ScheduleEventCreate } from "@/lib/contracts/schedule-events"
import { ScheduleEventsList } from "@/components/admin/timetable/ScheduleEventsList"
import { ScheduleEventForm } from "@/components/admin/timetable/ScheduleEventForm"

export function ScheduleEventsManager({ classId }: { classId?: number | null }) {
  const [opened, setOpened] = useState(false)
  const [editing, setEditing] = useState<ScheduleEvent | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [pendingDeletion, setPendingDeletion] = useState<number | null>(null)
  const { data: years } = useAcademicYears()
  const yearId = years?.items.find(y => y.is_current)?.id ?? null
  const { has } = usePermissions()
  const canRead = has("timetable:read")
  const canWrite = has("timetable:write")
  const { data: events, isLoading, isError, error, refetch } =
    useScheduleEvents(opened && canRead ? yearId : null, classId ?? undefined)
  const actions = useScheduleEventMutations()
  const isBusy =
    actions.createMany.isPending || actions.update.isPending || actions.remove.isPending

  function begin(event?: ScheduleEvent) {
    setEditing(event ?? null)
    setFormKey(key => key + 1)
    setShowForm(true)
  }

  async function submit(values: ScheduleEventCreate, days: ScheduleEventCreate["day"][]) {
    try {
      if (editing) {
        await actions.update.mutateAsync({ id: editing.id, data: values })
      } else {
        await actions.createMany.mutateAsync({ data: values, days })
      }
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
            <DialogTitle className="px-8 sm:pl-0">Rythme scolaire et séances spéciales</DialogTitle>
            <DialogDescription>
              Les pauses bloquantes sont exclues des cours et de leur génération.
              Les horaires s'appliquent chaque semaine de l'année scolaire.
            </DialogDescription>
          </DialogHeader>
          {!yearId ? <p role="status" className="text-sm text-muted-foreground">Configurez d'abord l'année scolaire en cours.</p>
          : !showForm ? (
            <ScheduleEventsList
              events={events}
              isLoading={isLoading}
              isError={isError}
              error={error}
              canWrite={canWrite}
              onRetry={() => refetch()}
              onAdd={() => begin()}
              onEdit={begin}
              onDelete={setPendingDeletion}
            />
          ) : (
            <ScheduleEventForm
              key={formKey}
              yearId={yearId}
              classId={classId ?? null}
              editing={editing}
              isBusy={isBusy}
              onCancel={() => setShowForm(false)}
              onSubmit={submit}
            />
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={pendingDeletion !== null} onOpenChange={open => { if (!open) setPendingDeletion(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>Supprimer définitivement cette période ?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setPendingDeletion(null)}>Annuler</Button>
            <Button variant="destructive" disabled={isBusy} onClick={remove}>Confirmer</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
