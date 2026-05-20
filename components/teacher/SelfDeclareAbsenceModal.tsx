"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Info } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useMyTimetable } from "@/lib/hooks/useTimetable"
import { useSelfDeclareAttendance } from "@/lib/hooks/useTeacherAttendance"
import {
  TeacherSelfDeclareCreateSchema,
  type TeacherSelfDeclareCreate,
} from "@/lib/contracts/teacher-attendance"
import {
  AttendanceFormFields,
  Form,
} from "@/components/admin/teachers/attendance/AttendanceFormFields"
import {
  cleanNotes,
  todayIso,
} from "@/components/admin/teachers/attendance/teacher-attendance-helpers"

interface SelfDeclareAbsenceModalProps {
  open: boolean
  onClose: () => void
}

const STATUS_OPTIONS: TeacherSelfDeclareCreate["status"][] = [
  "absent_excused",
  "absent_unexcused",
  "late",
]

export function SelfDeclareAbsenceModal({
  open,
  onClose,
}: SelfDeclareAbsenceModalProps) {
  const { data: slots = [], isLoading: slotsLoading } = useMyTimetable()
  const { mutate, isPending } = useSelfDeclareAttendance()

  const form = useForm<TeacherSelfDeclareCreate>({
    resolver: zodResolver(TeacherSelfDeclareCreateSchema),
    defaultValues: {
      slot_id: null,
      date: todayIso(),
      status: "absent_excused",
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

  function onSubmit(data: TeacherSelfDeclareCreate) {
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
          <DialogTitle>Me déclarer absent ou en retard</DialogTitle>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p>
            Votre déclaration sera envoyée à l&apos;administration pour
            validation avant d&apos;être comptabilisée. Pensez à informer aussi
            le secrétariat par téléphone si urgent.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <AttendanceFormFields
              form={form}
              statusOptions={STATUS_OPTIONS}
              statusLabel="Motif"
              slots={slots}
              slotsLoading={slotsLoading}
              slotLabel="Cours concerné (optionnel)"
              noSlotLabel="Aucun cours précis (toute la journée)"
              notesLabel="Précision (optionnel)"
              notesPlaceholder="Ex : Rendez-vous médical, urgence familiale, retard transport..."
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="h-11">
                Annuler
              </Button>
              <Button type="submit" disabled={isPending} className="h-11 font-semibold">
                {isPending ? "Envoi..." : "Envoyer la déclaration"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
