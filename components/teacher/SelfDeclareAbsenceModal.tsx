"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Info } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useMyTimetable } from "@/lib/hooks/useTimetable"
import { useSelfDeclareAttendance } from "@/lib/hooks/useTeacherAttendance"
import {
  TeacherSelfDeclareCreateSchema,
  type TeacherSelfDeclareCreate,
} from "@/lib/contracts/teacher-attendance"
import {
  STATUS_LABEL,
  todayIso,
} from "@/components/admin/teachers/attendance/teacher-attendance-helpers"

interface SelfDeclareAbsenceModalProps {
  open: boolean
  onClose: () => void
}

const FRENCH_DAY_LABEL: Record<string, string> = {
  lundi: "Lundi",
  mardi: "Mardi",
  mercredi: "Mercredi",
  jeudi: "Jeudi",
  vendredi: "Vendredi",
  samedi: "Samedi",
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
  saturday: "Samedi",
}

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
    const cleaned: TeacherSelfDeclareCreate = {
      ...data,
      late_minutes: data.status === "late" ? data.late_minutes : 0,
      notes: data.notes?.trim() ? data.notes.trim() : null,
      slot_id: data.slot_id ?? null,
    }
    mutate(cleaned, {
      onSuccess: () => {
        form.reset()
        onClose()
      },
    })
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motif</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) =>
                        field.onChange(v as TeacherSelfDeclareCreate["status"])
                      }
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="absent_excused">
                          {STATUS_LABEL.absent_excused}
                        </SelectItem>
                        <SelectItem value="absent_unexcused">
                          {STATUS_LABEL.absent_unexcused}
                        </SelectItem>
                        <SelectItem value="late">
                          {STATUS_LABEL.late}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="slot_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cours concerné (optionnel)</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : "none"}
                    onValueChange={(v) =>
                      field.onChange(v === "none" ? null : Number(v))
                    }
                    disabled={slotsLoading}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder={slotsLoading ? "Chargement..." : "Aucun cours précis"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">
                        Aucun cours précis (toute la journée)
                      </SelectItem>
                      {slots.map((slot) => {
                        const dayLabel = FRENCH_DAY_LABEL[slot.day] ?? slot.day
                        return (
                          <SelectItem key={slot.id} value={String(slot.id)}>
                            {dayLabel} {slot.start_time}–{slot.end_time} · {slot.subject_name} · {slot.class_name}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {status === "late" && (
              <FormField
                control={form.control}
                name="late_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minutes de retard</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={480}
                        step={5}
                        className="h-11"
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(Number(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Entre 1 et 480 (8h max).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Précision (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Ex : Rendez-vous médical, urgence familiale, retard transport..."
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
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
