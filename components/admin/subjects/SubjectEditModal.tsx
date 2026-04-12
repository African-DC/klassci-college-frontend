"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { SubjectUpdateSchema, type SubjectUpdate, SUBJECT_COLOR_PALETTE } from "@/lib/contracts/subject"
import { useSubject, useUpdateSubject } from "@/lib/hooks/useSubjects"
import { useSeriesList } from "@/lib/hooks/useSeries"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
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

function EditFormSkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 4 }).map((_, i) => (
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

  const isCatalogue = !subject?.level_id
  const isAssigned = !!subject?.level_id

  const { data: seriesData } = useSeriesList(
    subject?.level_id ? { level_id: subject.level_id, size: 100 } : {},
  )
  const seriesForLevel = subject?.level_id ? (seriesData?.items ?? []) : []

  const form = useForm<SubjectUpdate>({
    resolver: zodResolver(SubjectUpdateSchema),
    values: subject
      ? {
          name: subject.name,
          coefficient: subject.coefficient,
          hours_per_week: subject.hours_per_week,
          color: subject.color ?? "blue",
          series_id: subject.series_id ?? undefined,
        }
      : undefined,
  })

  if (isLoading || !subject) return <EditFormSkeleton />

  function onSubmit(data: SubjectUpdate) {
    const payload = { ...data }
    if (isCatalogue) {
      // Catalogue: only update name + color
      delete payload.coefficient
      delete payload.hours_per_week
      delete payload.level_id
      delete payload.series_id
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

        {/* Color picker */}
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

        {/* For assigned subjects: show level (read-only) + series + coef + hours */}
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
          </>
        )}

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
