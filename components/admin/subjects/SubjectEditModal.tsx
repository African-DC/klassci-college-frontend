"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { SubjectUpdateSchema, type SubjectUpdate } from "@/lib/contracts/subject"
import { useSubject, useUpdateSubject } from "@/lib/hooks/useSubjects"
import { useLevels } from "@/lib/hooks/useLevels"
import { useSeriesList } from "@/lib/hooks/useSeries"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
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

function EditFormSkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
      <Skeleton className="h-11 w-full" />
    </div>
  )
}

function EditForm({ subjectId, onClose }: { subjectId: number; onClose: () => void }) {
  const { data: subject, isLoading } = useSubject(subjectId)
  const { mutate, isPending, error } = useUpdateSubject(subjectId)
  const { data: levelsData } = useLevels({ size: 100 })
  const levels = levelsData?.items

  const form = useForm<SubjectUpdate>({
    resolver: zodResolver(SubjectUpdateSchema),
    values: subject
      ? {
          name: subject.name,
          coefficient: subject.coefficient,
          hours_per_week: subject.hours_per_week,
          level_id: subject.level_id ?? undefined,
          series_id: subject.series_id ?? undefined,
        }
      : undefined,
  })

  const selectedLevelId = form.watch("level_id")
  const { data: seriesData } = useSeriesList(
    selectedLevelId ? { level_id: selectedLevelId, size: 100 } : {},
  )
  const seriesForLevel = selectedLevelId ? (seriesData?.items ?? []) : []

  const initialLevelRef = subject?.level_id
  useEffect(() => {
    if (initialLevelRef && selectedLevelId && selectedLevelId !== initialLevelRef) {
      form.setValue("series_id", undefined)
    }
  }, [selectedLevelId, initialLevelRef, form])

  if (isLoading || !subject) return <EditFormSkeleton />

  function onSubmit(data: SubjectUpdate) {
    const payload = {
      ...data,
      level_id: data.level_id || null,
      series_id: data.series_id || null,
    }
    mutate(payload, { onSuccess: onClose })
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="level_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Niveau</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(v === "all" ? undefined : Number(v))}
                  value={field.value?.toString() ?? "all"}
                >
                  <FormControl>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Tous les niveaux" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">Tous les niveaux</SelectItem>
                    {levels?.map((level) => (
                      <SelectItem key={level.id} value={level.id.toString()}>
                        {level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

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
        </div>

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

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
            <p className="text-sm text-destructive">{error.message}</p>
          </div>
        )}

        <Button type="submit" size="lg" className="w-full h-11 font-semibold" disabled={isPending}>
          {isPending ? "Enregistrement..." : "Mettre à jour"}
        </Button>
      </form>
    </Form>
  )
}

interface SubjectEditModalProps {
  subjectId: number | null
  open: boolean
  onClose: () => void
}

export function SubjectEditModal({ subjectId, open, onClose }: SubjectEditModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Modifier la matière</DialogTitle>
        </DialogHeader>
        {subjectId && <EditForm subjectId={subjectId} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}
