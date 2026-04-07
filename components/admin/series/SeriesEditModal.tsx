"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { SeriesUpdateSchema, type SeriesUpdate } from "@/lib/contracts/series"
import { useSeriesDetail, useUpdateSeries } from "@/lib/hooks/useSeries"
import { useLevels } from "@/lib/hooks/useLevels"
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
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
      <Skeleton className="h-11 w-full" />
    </div>
  )
}

function EditForm({ seriesId, onClose }: { seriesId: number; onClose: () => void }) {
  const { data: seriesData, isLoading } = useSeriesDetail(seriesId)
  const { mutate, isPending, error } = useUpdateSeries(seriesId)
  const { data: levelsData } = useLevels()
  const levels = levelsData?.items

  const form = useForm<SeriesUpdate>({
    resolver: zodResolver(SeriesUpdateSchema),
    values: seriesData
      ? {
          name: seriesData.name,
          level_id: seriesData.level_id,
        }
      : undefined,
  })

  if (isLoading || !seriesData) return <EditFormSkeleton />

  function onSubmit(data: SeriesUpdate) {
    mutate(data, { onSuccess: onClose })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de la serie</FormLabel>
              <FormControl>
                <Input className="h-11" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                    <SelectValue placeholder="Selectionner un niveau" />
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

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
            <p className="text-sm text-destructive">{error.message}</p>
          </div>
        )}

        <Button type="submit" size="lg" className="w-full h-11 font-semibold" disabled={isPending}>
          {isPending ? "Enregistrement..." : "Mettre a jour"}
        </Button>
      </form>
    </Form>
  )
}

interface SeriesEditModalProps {
  seriesId: number | null
  open: boolean
  onClose: () => void
}

export function SeriesEditModal({ seriesId, open, onClose }: SeriesEditModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Modifier la serie</DialogTitle>
        </DialogHeader>
        {seriesId && <EditForm seriesId={seriesId} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}
