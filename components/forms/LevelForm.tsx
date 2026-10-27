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
            <FormItem className="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-muted/30 p-4">
              <div className="space-y-1">
                <FormLabel className="text-sm font-semibold">LV2 disponible</FormLabel>
                <p className="text-xs text-muted-foreground">Ce réglage concerne uniquement les classes rattachées à ce niveau.</p>
              </div>
              <FormControl>
                <Switch checked={field.value === true} onCheckedChange={field.onChange} aria-label="Autoriser la LV2 pour ce niveau" />
              </FormControl>
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
          {isPending ? "Enregistrement..." : "Enregistrer le niveau"}
        </Button>
      </form>
    </Form>
  )
}
