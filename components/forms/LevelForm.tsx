"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LevelCreateSchema, type LevelCreate } from "@/lib/contracts/level"
import { useCreateLevel } from "@/lib/hooks/useLevels"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

interface LevelFormProps {
  onSuccess: () => void
}

export function LevelForm({ onSuccess }: LevelFormProps) {
  const form = useForm<LevelCreate>({
    resolver: zodResolver(LevelCreateSchema),
    defaultValues: {
      name: "",
      order: undefined,
      lv2_enabled: true,
    },
  })

  const { mutate, isPending, error } = useCreateLevel()

  function onSubmit(data: LevelCreate) {
    mutate(data, {
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
              <FormLabel>Nom du niveau *</FormLabel>
              <FormControl>
                <Input placeholder="Ex : 6eme, Terminale" className="h-11" {...field} />
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
              <FormLabel>Ordre d'affichage *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  placeholder="Ex : 1"
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
          {isPending ? "Enregistrement..." : "Enregistrer le niveau"}
        </Button>
      </form>
    </Form>
  )
}
