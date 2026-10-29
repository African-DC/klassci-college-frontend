"use client"

import { useWatch, type UseFormReturn } from "react-hook-form"
import { Plus, Pencil } from "lucide-react"
import type { TimetableSlotCreate } from "@/lib/contracts/timetable"
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

export type TeacherFieldStatus = "loading" | "error" | "ready"

interface TeacherFieldProps {
  form: UseFormReturn<TimetableSlotCreate>
  /** Matières de la classe avec leurs enseignants retenus ; undefined tant qu'elles ne sont pas chargées. */
  items: ClassSubjectTeacherItem[] | undefined
  status: TeacherFieldStatus
  /** Enseignant déjà affecté au créneau (modification) : affiché même s'il n'est plus retenu. */
  currentTeacher?: { id: number; name: string }
  onRetry: () => void
  onCreateTeacher: () => void
  onManageAssignment?: () => void
}

interface Choice {
  id: number
  label: string
}

/** Choix proposés : les enseignants retenus, plus l'affectation actuelle si elle n'est plus retenue. */
function buildChoices(
  eligible: { id: number; full_name: string }[],
  current: TeacherFieldProps["currentTeacher"],
  value: number | undefined,
  known: boolean,
): Choice[] {
  const choices = eligible.map((t) => ({ id: t.id, label: t.full_name }))
  if (!current || value !== current.id || choices.some((c) => c.id === current.id)) return choices
  const label = known ? `${current.name} (non retenu pour cette matière)` : current.name
  return [...choices, { id: current.id, label }]
}

/**
 * Enseignant d'un créneau : seuls les enseignants retenus pour la matière dans
 * cette classe sont proposés. Le choix initial vient du formulaire, sans effet.
 */
export function TeacherField({
  form,
  items,
  status,
  currentTeacher,
  onRetry,
  onCreateTeacher,
  onManageAssignment,
}: TeacherFieldProps) {
  const subjectId = useWatch({ control: form.control, name: "subject_id" })
  const item = items?.find((i) => i.subject_id === subjectId)
  const known = status === "ready" && item !== undefined

  return (
    <FormField
      control={form.control}
      name="teacher_id"
      render={({ field }) => {
        const choices = buildChoices(
          item?.eligible_teachers ?? [],
          currentTeacher,
          field.value,
          known,
        )
        const notRetenu =
          known &&
          currentTeacher !== undefined &&
          field.value === currentTeacher.id &&
          !(item?.eligible_teachers ?? []).some((t) => t.id === currentTeacher.id)

        return (
          <FormItem>
            <FormLabel>Enseignant *</FormLabel>
            <div className="flex items-center gap-2">
              <Select
                onValueChange={(v) => field.onChange(Number(v))}
                value={field.value?.toString() ?? ""}
                disabled={!subjectId || status !== "ready" || choices.length === 0}
              >
                <FormControl>
                  <SelectTrigger className="h-11 min-w-0 flex-1">
                    <SelectValue placeholder="Sélectionner un enseignant" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {choices.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.label}
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
                aria-label="Créer un enseignant"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {subjectId && status === "ready" && onManageAssignment && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onManageAssignment}
                className="h-9 gap-2 text-primary"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                Modifier l'enseignant de cette classe
              </Button>
            )}
            {status === "error" && (
              <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2">
                <p className="text-xs text-destructive">
                  Impossible de charger les enseignants de la classe.
                </p>
                <Button type="button" variant="outline" className="h-11 sm:h-10" onClick={onRetry}>
                  Réessayer
                </Button>
              </div>
            )}
            {notRetenu && (
              <p className="text-xs text-amber-800 dark:text-amber-200">
                Ce créneau est assigné à un enseignant non retenu pour cette matière dans cette classe.
              </p>
            )}
            {subjectId && status === "ready" && choices.length === 0 && (
              <p className="text-xs text-amber-800 dark:text-amber-200">
                Aucun enseignant retenu pour cette matière dans cette classe. Choisissez-le dans Enseignants de la classe.
              </p>
            )}
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}
