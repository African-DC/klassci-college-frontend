"use client"

import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarOff, Loader2, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { HolidaysUpdateSchema, type HolidaysUpdate, type SchoolSettings } from "@/lib/contracts/settings"
import { useUpdateHolidays } from "@/lib/hooks/useSettings"

interface HolidaySectionProps {
  settings: SchoolSettings
}

export function HolidaySection({ settings }: HolidaySectionProps) {
  const { mutate, isPending } = useUpdateHolidays()

  const form = useForm<HolidaysUpdate>({
    resolver: zodResolver(HolidaysUpdateSchema),
    defaultValues: { holidays: settings.holidays ?? [] },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "holidays",
  })

  function onSubmit(data: HolidaysUpdate) {
    mutate(data)
  }

  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <CalendarOff className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Congés &amp; jours fériés</CardTitle>
            <p className="text-sm text-muted-foreground">
              Congés de Toussaint, fêtes, jours fériés. Ces jours sont exclus du cahier de texte.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {fields.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Aucun congé enregistré. Ajoutez les vacances et jours fériés de l&apos;année pour
                qu&apos;ils n&apos;apparaissent pas dans le cahier de texte.
              </p>
            ) : (
              fields.map((field, index) => (
                <div key={field.id} className="rounded-lg border p-4">
                  <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
                    <FormField
                      control={form.control}
                      name={`holidays.${index}.label`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>Libellé</FormLabel>
                          <FormControl>
                            <Input placeholder="ex : Congés de Toussaint" className="h-11 sm:h-10" {...f} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`holidays.${index}.start_date`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>Début</FormLabel>
                          <FormControl>
                            <Input type="date" className="h-11 sm:h-10" {...f} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`holidays.${index}.end_date`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>Fin</FormLabel>
                          <FormControl>
                            <Input type="date" className="h-11 sm:h-10" {...f} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Supprimer le congé ${index + 1}`}
                      className="h-11 w-11 shrink-0 text-muted-foreground hover:text-destructive sm:h-10 sm:w-10"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}

            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                className="h-11 sm:h-10"
                onClick={() => append({ label: "", start_date: "", end_date: "" })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un congé
              </Button>
              <Button type="submit" disabled={isPending} className="h-11 sm:h-10">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
