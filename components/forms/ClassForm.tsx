"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ClassCreateSchema, type ClassCreate } from "@/lib/contracts/class"
import { useCreateClass } from "@/lib/hooks/useClasses"
import { useLevels } from "@/lib/hooks/useLevels"
import { useSeriesList } from "@/lib/hooks/useSeries"
import { useAcademicYears } from "@/lib/hooks/useAcademicYears"
import { useRooms } from "@/lib/hooks/useRooms"
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

interface ClassFormProps {
  onSuccess: () => void
}

export function ClassForm({ onSuccess }: ClassFormProps) {
  const form = useForm<ClassCreate>({
    resolver: zodResolver(ClassCreateSchema),
    defaultValues: {
      name: "",
      level_id: undefined,
      series_id: undefined,
      max_students: undefined,
      room_id: undefined,
    },
  })

  const { data: levelsData } = useLevels({ size: 100 })
  const levels = levelsData?.items

  const { data: academicYearsData } = useAcademicYears()
  const currentYear = academicYearsData?.items?.find((y) => y.is_current)

  const { data: roomsData } = useRooms({ size: 100 })
  const rooms = roomsData?.items

  const selectedLevelId = form.watch("level_id")
  const { data: seriesData } = useSeriesList(
    selectedLevelId ? { level_id: selectedLevelId, size: 100 } : {},
  )
  const seriesForLevel = selectedLevelId ? (seriesData?.items ?? []) : []

  // Reset series when level changes
  useEffect(() => {
    form.setValue("series_id", undefined)
  }, [selectedLevelId, form])

  const { mutate, isPending, error } = useCreateClass()

  function onSubmit(data: ClassCreate) {
    // Auto-assign current academic year
    const payload = {
      ...data,
      academic_year_id: currentYear?.id ?? data.academic_year_id,
      series_id: data.series_id || null,
      room_id: data.room_id || null,
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
              <FormLabel>Nom de la classe *</FormLabel>
              <FormControl>
                <Input placeholder="Ex : 6ème A" className="h-11" {...field} />
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
                <FormLabel>Niveau *</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(Number(v))}
                  value={field.value?.toString() ?? ""}
                >
                  <FormControl>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Sélectionner un niveau" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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
                        <SelectValue placeholder="Aucune série" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Aucune</SelectItem>
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
            name="max_students"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacité max</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Ex : 45"
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
            name="room_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Salle</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(v === "none" ? undefined : Number(v))}
                  value={field.value?.toString() ?? "none"}
                >
                  <FormControl>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Aucune salle" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    {rooms?.map((room) => (
                      <SelectItem key={room.id} value={room.id.toString()}>
                        {room.name} {room.capacity ? `(${room.capacity} places)` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
          {isPending ? "Enregistrement..." : "Enregistrer la classe"}
        </Button>
      </form>
    </Form>
  )
}
