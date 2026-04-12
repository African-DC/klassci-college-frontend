"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ClassUpdateSchema, type ClassUpdate } from "@/lib/contracts/class"
import { useClass, useUpdateClass } from "@/lib/hooks/useClasses"
import { useLevels } from "@/lib/hooks/useLevels"
import { useSeriesList } from "@/lib/hooks/useSeries"
import { useRooms } from "@/lib/hooks/useRooms"
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

function EditForm({ classId, onClose }: { classId: number; onClose: () => void }) {
  const { data: classData, isLoading } = useClass(classId)
  const { mutate, isPending, error } = useUpdateClass(classId)

  const { data: levelsData } = useLevels({ size: 100 })
  const levels = levelsData?.items

  const { data: roomsData } = useRooms({ size: 100 })
  const rooms = roomsData?.items

  const form = useForm<ClassUpdate>({
    resolver: zodResolver(ClassUpdateSchema),
    values: classData
      ? {
          name: classData.name,
          level_id: classData.level_id,
          series_id: classData.series_id ?? undefined,
          max_students: classData.max_students ?? undefined,
          room_id: classData.room_id ?? undefined,
        }
      : undefined,
  })

  const selectedLevelId = form.watch("level_id")
  const { data: seriesData } = useSeriesList(
    selectedLevelId ? { level_id: selectedLevelId, size: 100 } : {},
  )
  const seriesForLevel = selectedLevelId ? (seriesData?.items ?? []) : []

  // Reset series when level changes (but not on initial load)
  const initialLevelRef = classData?.level_id
  useEffect(() => {
    if (initialLevelRef && selectedLevelId && selectedLevelId !== initialLevelRef) {
      form.setValue("series_id", undefined)
    }
  }, [selectedLevelId, initialLevelRef, form])

  if (isLoading || !classData) return <EditFormSkeleton />

  function onSubmit(data: ClassUpdate) {
    const payload = {
      ...data,
      series_id: data.series_id || null,
      room_id: data.room_id || null,
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
              <FormLabel>Nom de la classe</FormLabel>
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
          {isPending ? "Enregistrement..." : "Mettre à jour"}
        </Button>
      </form>
    </Form>
  )
}

interface ClassEditModalProps {
  classId: number | null
  open: boolean
  onClose: () => void
}

export function ClassEditModal({ classId, open, onClose }: ClassEditModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Modifier la classe</DialogTitle>
        </DialogHeader>
        {classId && <EditForm classId={classId} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}
