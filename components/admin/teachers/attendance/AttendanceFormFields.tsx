"use client"

import type { UseFormReturn, FieldValues, Path } from "react-hook-form"
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
import type { TimetableSlot } from "@/lib/contracts/timetable"
import { STATUS_LABEL, formatSlotOption } from "./teacher-attendance-helpers"

type Status = "present" | "absent_excused" | "absent_unexcused" | "late"

interface AttendanceFormFieldsProps<TForm extends FieldValues> {
  form: UseFormReturn<TForm>
  /** Status options offered in the Statut/Motif select (order preserved). */
  statusOptions: Status[]
  /** Label of the status field — "Statut" (admin) or "Motif" (self-declare). */
  statusLabel: string
  /** Available timetable slots — pre-loaded by the parent. */
  slots: TimetableSlot[]
  slotsLoading: boolean
  /** Label of the slot field — "Créneau concerné" (admin) or "Cours concerné" (self). */
  slotLabel: string
  /** Placeholder shown for the "no slot" option in the select. */
  noSlotLabel: string
  /** Optional helper text displayed below the slot select. */
  slotDescription?: string
  /** Label/placeholder for the notes textarea. */
  notesLabel: string
  notesPlaceholder: string
}

/**
 * Renders the date+status grid, slot select, conditional late minutes,
 * and notes textarea — shared by AttendanceRecordModal (admin) and
 * SelfDeclareAbsenceModal (teacher). Touch targets h-11 for mobile.
 */
export function AttendanceFormFields<TForm extends FieldValues>({
  form,
  statusOptions,
  statusLabel,
  slots,
  slotsLoading,
  slotLabel,
  noSlotLabel,
  slotDescription,
  notesLabel,
  notesPlaceholder,
}: AttendanceFormFieldsProps<TForm>) {
  const status = form.watch("status" as Path<TForm>) as Status
  const dateField = "date" as Path<TForm>
  const statusField = "status" as Path<TForm>
  const slotField = "slot_id" as Path<TForm>
  const lateField = "late_minutes" as Path<TForm>
  const notesField = "notes" as Path<TForm>

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={dateField}
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
          name={statusField}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{statusLabel}</FormLabel>
              <Select
                value={field.value as string}
                onValueChange={(v) => field.onChange(v as Status)}
              >
                <FormControl>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {STATUS_LABEL[opt]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name={slotField}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{slotLabel}</FormLabel>
            <Select
              value={field.value ? String(field.value) : "none"}
              onValueChange={(v) =>
                field.onChange(v === "none" ? null : Number(v))
              }
              disabled={slotsLoading}
            >
              <FormControl>
                <SelectTrigger className="h-11">
                  <SelectValue
                    placeholder={slotsLoading ? "Chargement..." : noSlotLabel}
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="none">{noSlotLabel}</SelectItem>
                {slots.map((slot) => (
                  <SelectItem key={slot.id} value={String(slot.id)}>
                    {formatSlotOption(slot)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {slotDescription && (
              <FormDescription className="text-xs">
                {slotDescription}
              </FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      {status === "late" && (
        <FormField
          control={form.control}
          name={lateField}
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
                  value={(field.value as number | undefined) ?? 0}
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
        name={notesField}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{notesLabel}</FormLabel>
            <FormControl>
              <Textarea
                rows={3}
                placeholder={notesPlaceholder}
                value={(field.value as string | null | undefined) ?? ""}
                onChange={field.onChange}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}

// Re-export Form to avoid duplicate imports in the modal files.
export { Form }
