"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useTeacherTimetable } from "@/lib/hooks/useTimetable"
import { useRecordTeacherAttendance } from "@/lib/hooks/useTeacherAttendance"
import {
  TeacherAttendanceCreateSchema,
  type TeacherAttendanceCreate,
} from "@/lib/contracts/teacher-attendance"
import { AttendanceFormFields, Form } from "./AttendanceFormFields"
import { cleanNotes, todayIso } from "./teacher-attendance-helpers"

interface AttendanceRecordModalProps {
  teacherId: number
  open: boolean
  onClose: () => void
}

const STATUS_OPTIONS: TeacherAttendanceCreate["status"][] = [
  "absent_unexcused",
  "absent_excused",
  "late",
  "present",
]

export function AttendanceRecordModal({
  teacherId,
  open,
  onClose,
}: AttendanceRecordModalProps) {
  const { data: slots = [], isLoading: slotsLoading } = useTeacherTimetable(teacherId)
  const { mutate, isPending } = useRecordTeacherAttendance(teacherId)

  const form = useForm<TeacherAttendanceCreate>({
    resolver: zodResolver(TeacherAttendanceCreateSchema),
    defaultValues: {
      slot_id: null,
      date: todayIso(),
      status: "absent_unexcused",
      late_minutes: 0,
      notes: null,
    },
  })

  const status = form.watch("status")

  useEffect(() => {
    if (status !== "late" && form.getValues("late_minutes") !== 0) {
      form.setValue("late_minutes", 0, { shouldValidate: true })
    }
  }, [status, form])

  useEffect(() => {
    if (!open) form.reset()
  }, [open, form])

  function onSubmit(data: TeacherAttendanceCreate) {
    mutate(
      {
        ...data,
        notes: cleanNotes(data.notes),
        slot_id: data.slot_id ?? null,
      },
      {
        onSuccess: () => {
          form.reset()
          onClose()
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <DialogContent className="max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Saisir une absence ou un retard</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <AttendanceFormFields
              form={form}
              statusOptions={STATUS_OPTIONS}
              statusLabel="Statut"
              slots={slots}
              slotsLoading={slotsLoading}
              slotLabel="Créneau concerné (optionnel)"
              noSlotLabel="Aucun créneau (absence hors EDT)"
              slotDescription="Lier au créneau pour un calcul d'heures précis (DREN)."
              notesLabel="Notes (optionnel)"
              notesPlaceholder="Justification, contexte, pièce jointe transmise..."
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="h-11">
                Annuler
              </Button>
              <Button type="submit" disabled={isPending} className="h-11 font-semibold">
                {isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
