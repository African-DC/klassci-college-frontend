"use client"

import type { UseFormReturn } from "react-hook-form"
import { Plus } from "lucide-react"
import type { TimetableSlotCreate } from "@/lib/contracts/timetable"
import type { Subject } from "@/lib/contracts/subject"
import type { ClassSubjectTeacherItem } from "@/lib/contracts/class-subject-teachers"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

interface SubjectFieldProps {
  form: UseFormReturn<TimetableSlotCreate>
  subjects: Subject[]
  items: ClassSubjectTeacherItem[] | undefined
  onCreateSubject: () => void
}

/**
 * Choisir une matière fixe l'enseignant : celui que la classe retient pour elle.
 * Sans enseignant retenu, le champ reste vide et le message « requis » s'affiche.
 */
export function SubjectField({ form, subjects, items, onCreateSubject }: SubjectFieldProps) {
  return (
    <FormField
      control={form.control}
      name="subject_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Matière *</FormLabel>
          <div className="flex items-center gap-2">
            <Select
              onValueChange={(v) => {
                const subjectId = Number(v)
                field.onChange(subjectId)
                const resolved = items?.find((i) => i.subject_id === subjectId)?.resolved_teacher_id
                // undefined, et non null : c'est ce qui déclenche le message « requis ».
                form.setValue("teacher_id", resolved ?? (undefined as unknown as number), {
                  shouldDirty: true,
                })
              }}
              value={field.value?.toString() ?? ""}
            >
              <FormControl>
                <SelectTrigger className="h-11 min-w-0 flex-1">
                  <SelectValue placeholder="Sélectionner une matière" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.name} (Coef. {s.coefficient}, {s.hours_per_week}h/sem)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-11 w-11 shrink-0"
              onClick={onCreateSubject}
              title="Créer une matière"
              aria-label="Créer une matière"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
