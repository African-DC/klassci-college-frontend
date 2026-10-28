"use client"

import { useEffect, useRef } from "react"
import { useWatch, type UseFormReturn } from "react-hook-form"
import { Plus } from "lucide-react"
import type { TimetableSlotCreate } from "@/lib/contracts/timetable"
import { useClassSubjectTeachers } from "@/lib/hooks/useClassSubjectTeachers"
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

interface TeacherFieldProps {
  form: UseFormReturn<TimetableSlotCreate>
  classId: number | undefined
  onCreateTeacher: () => void
}

/**
 * Enseignant d'un créneau : seuls les enseignants retenus pour la matière dans
 * cette classe sont proposés. Le choix par défaut suit la matière choisie.
 */
export function TeacherField({ form, classId, onCreateTeacher }: TeacherFieldProps) {
  const subjectId = useWatch({ control: form.control, name: "subject_id" })
  const { data, isLoading } = useClassSubjectTeachers(classId)
  const item = data?.items.find((i) => i.subject_id === subjectId)
  const options = item?.eligible_teachers ?? []
  const previousSubject = useRef(subjectId)

  // Au changement de matière seulement : en modification, l'enseignant du
  // créneau existant n'est pas remplacé au montage.
  useEffect(() => {
    if (previousSubject.current === subjectId) return
    if (!item && isLoading) return
    previousSubject.current = subjectId
    // resetField vide le choix quand la matière n'a pas d'enseignant retenu.
    form.resetField("teacher_id", { defaultValue: item?.resolved_teacher_id ?? undefined })
  }, [subjectId, item, isLoading, form])

  return (
    <FormField
      control={form.control}
      name="teacher_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Enseignant *</FormLabel>
          <div className="flex items-center gap-2">
            <Select
              onValueChange={(v) => field.onChange(Number(v))}
              value={field.value?.toString() ?? ""}
              disabled={!subjectId || options.length === 0}
            >
              <FormControl>
                <SelectTrigger className="h-11 min-w-0 flex-1">
                  <SelectValue placeholder="Sélectionner un enseignant" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {options.map((t) => (
                  <SelectItem key={t.id} value={t.id.toString()}>
                    {t.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-11 w-11 shrink-0"
              onClick={onCreateTeacher}
              title="Créer un enseignant"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {subjectId && !isLoading && options.length === 0 && (
            <p className="text-xs text-amber-800 dark:text-amber-200">
              Aucun enseignant retenu pour cette matière dans cette classe. Choisissez-le dans Enseignants de la classe.
            </p>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
