"use client"

import { useId } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { SubjectUpdateSchema, type Subject, type SubjectUpdate, SUBJECT_COLOR_PALETTE } from "@/lib/contracts/subject"
import { useUpdateSubject } from "@/lib/hooks/useSubjects"
import { useSeriesList } from "@/lib/hooks/useSeries"
import { subjectTeachers } from "@/lib/utils/subject-teachers"
import { TeacherMultiSelect } from "./TeacherMultiSelect"
import { SubjectTeacherRemovalDialog } from "./SubjectTeacherRemovalDialog"
import { useTeacherRemovalGuard } from "./useTeacherRemovalGuard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Form,
  FormControl,
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

interface Props {
  subject: Subject
  onClose: () => void
}

/**
 * Formulaire d'édition. Monté seulement une fois la matière chargée (voir
 * SubjectEditModal), avec `key={subject.id}` : les valeurs par défaut viennent
 * toujours de données réelles.
 */
export function SubjectEditForm({ subject, onClose }: Props) {
  const { mutate, isPending, error } = useUpdateSubject(subject.id)
  const guard = useTeacherRemovalGuard(subject.id)
  const teachersLabelId = useId()

  const isCatalogue = !subject.level_id
  const isAssigned = !!subject.level_id
  const initialTeacherIds = subjectTeachers(subject).map((t) => t.id)

  const { data: seriesData } = useSeriesList(
    subject.level_id ? { level_id: subject.level_id, size: 100 } : {},
  )
  const seriesForLevel = subject.level_id ? (seriesData?.items ?? []) : []

  const form = useForm<SubjectUpdate>({
    resolver: zodResolver(SubjectUpdateSchema),
    defaultValues: {
      name: subject.name,
      coefficient: subject.coefficient,
      hours_per_week: subject.hours_per_week,
      color: subject.color ?? "blue",
      series_id: subject.series_id ?? undefined,
      teacher_ids: initialTeacherIds,
    },
  })

  const save = (payload: SubjectUpdate) => mutate(payload, { onSuccess: onClose })

  async function onSubmit(data: SubjectUpdate) {
    const payload = { ...data }
    if (isCatalogue) {
      // Catalogue : seuls le nom et la couleur sont modifiables
      delete payload.coefficient
      delete payload.hours_per_week
      delete payload.level_id
      delete payload.series_id
      delete payload.teacher_ids
      save(payload)
      return
    }
    const keptIds = data.teacher_ids ?? []
    const removedIds = initialTeacherIds.filter((id) => !keptIds.includes(id))
    await guard.check(removedIds, () => save(payload))
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de la matière</FormLabel>
              <FormControl>
                <Input className="h-11" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Couleur</FormLabel>
              <div className="grid grid-cols-6 gap-2">
                {SUBJECT_COLOR_PALETTE.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    className={`h-8 w-8 rounded-full transition-all ${c.class} ${
                      field.value === c.value
                        ? "ring-2 ring-offset-2 ring-primary scale-110"
                        : "opacity-70 hover:opacity-100 hover:scale-105"
                    }`}
                    title={c.label}
                    onClick={() => field.onChange(c.value)}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {isAssigned && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Niveau :</span>
              <Badge variant="secondary">{subject.level_name}</Badge>
            </div>

            {seriesForLevel.length > 0 && (
              <FormField
                control={form.control}
                name="series_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Série</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === "none" ? undefined : Number(v))}
                      value={field.value?.toString() ?? "none"}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Toutes séries" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Toutes séries</SelectItem>
                        {seriesForLevel.map((s) => (
                          <SelectItem key={s.id} value={s.id.toString()}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="coefficient"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coefficient</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        className="h-11"
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hours_per_week"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heures / semaine</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        className="h-11"
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="teacher_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel id={teachersLabelId}>Enseignants assignés</FormLabel>
                  <FormControl>
                    <TeacherMultiSelect
                      value={field.value ?? []}
                      onChange={field.onChange}
                      knownTeachers={subjectTeachers(subject)}
                      aria-labelledby={teachersLabelId}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
            <p className="text-sm text-destructive">{error.message}</p>
          </div>
        )}

        <Button type="submit" size="lg" className="w-full h-11 font-semibold" disabled={isPending || guard.isChecking}>
          {isPending ? "Enregistrement..." : guard.isChecking ? "Vérification..." : "Mettre à jour"}
        </Button>
      </form>
      <SubjectTeacherRemovalDialog
        open={guard.pendingRemoval !== null}
        slots={guard.pendingRemoval?.slots ?? 0}
        onCancel={guard.cancel}
        onConfirm={guard.confirm}
      />
    </Form>
  )
}
