"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { SubjectCreateSchema, type SubjectCreate, SUBJECT_COLOR_PALETTE } from "@/lib/contracts/subject"
import { useCreateSubject } from "@/lib/hooks/useSubjects"
import { useLevels } from "@/lib/hooks/useLevels"
import { useSeriesList } from "@/lib/hooks/useSeries"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

interface SubjectFormProps {
  onSuccess: () => void
}

export function SubjectForm({ onSuccess }: SubjectFormProps) {
  const form = useForm<SubjectCreate>({
    resolver: zodResolver(SubjectCreateSchema),
    defaultValues: {
      name: "",
      coefficient: 1,
      hours_per_week: 1,
      level_id: undefined,
      series_id: undefined,
      color: "blue",
    },
  })

  const { data: levelsData } = useLevels({ size: 100 })
  const levels = levelsData?.items

  const selectedLevelId = form.watch("level_id")
  const { data: seriesData } = useSeriesList(
    selectedLevelId ? { level_id: selectedLevelId, size: 100 } : {},
  )
  const seriesForLevel = selectedLevelId ? (seriesData?.items ?? []) : []

  useEffect(() => {
    form.setValue("series_id", undefined)
  }, [selectedLevelId, form])

  const { mutate, isPending, error } = useCreateSubject()

  function onSubmit(data: SubjectCreate) {
    const payload = {
      ...data,
      level_id: data.level_id || null,
      series_id: data.series_id || null,
    }
    mutate(payload, {
      onSuccess: () => {
        form.reset()
        onSuccess()
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de la matière *</FormLabel>
              <FormControl>
                <Input placeholder="Ex : Mathématiques" className="h-11" {...field} />
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
              <div className="flex flex-wrap gap-2">
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

          {seriesForLevel.length > 0 ? (
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
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="coefficient"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Coefficient *</FormLabel>
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
                <FormLabel>Heures / semaine *</FormLabel>
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
          {isPending ? "Enregistrement..." : "Enregistrer la matière"}
        </Button>
      </form>
    </Form>
  )
}
