"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LevelUpdateSchema, type LevelUpdate } from "@/lib/contracts/level"
import { useLevel, useUpdateLevel } from "@/lib/hooks/useLevels"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

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

function EditForm({ levelId, onClose }: { levelId: number; onClose: () => void }) {
  const { data: levelData, isLoading } = useLevel(levelId)
  const { mutate, isPending, error } = useUpdateLevel(levelId)

  const form = useForm<LevelUpdate>({
    resolver: zodResolver(LevelUpdateSchema),
    values: levelData
      ? {
          name: levelData.name,
          order: levelData.order,
          lv2_enabled: levelData.lv2_enabled,
        }
      : undefined,
  })

  if (isLoading || !levelData) return <EditFormSkeleton />

  function onSubmit(data: LevelUpdate) {
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
              <FormLabel>Nom du niveau</FormLabel>
              <FormControl>
                <Input className="h-11" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ordre d'affichage</FormLabel>
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
          name="lv2_enabled"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 px-4 py-3">
              <div className="min-w-0 space-y-1">
                <FormLabel>LV2 autorisée</FormLabel>
                <p className="text-xs text-muted-foreground">
                  Autoriser la deuxième langue vivante dans les inscriptions de ce niveau.
                </p>
              </div>
              <FormControl>
                <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
              </FormControl>
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

interface LevelEditModalProps {
  levelId: number | null
  open: boolean
  onClose: () => void
}

export function LevelEditModal({ levelId, open, onClose }: LevelEditModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Modifier le niveau</DialogTitle>
        </DialogHeader>
        {levelId && <EditForm levelId={levelId} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}
