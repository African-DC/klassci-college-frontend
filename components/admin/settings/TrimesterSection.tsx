"use client"

import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarDays, Loader2 } from "lucide-react"
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
import { TrimesterUpdateSchema, type TrimesterUpdate, type SchoolSettings } from "@/lib/contracts/settings"
import { useUpdateTrimesters } from "@/lib/hooks/useSettings"

const DEFAULT_TRIMESTERS = [
  { label: "Trimestre 1", start_date: "", end_date: "" },
  { label: "Trimestre 2", start_date: "", end_date: "" },
  { label: "Trimestre 3", start_date: "", end_date: "" },
]

interface TrimesterSectionProps {
  settings: SchoolSettings
}

export function TrimesterSection({ settings }: TrimesterSectionProps) {
  const { mutate, isPending } = useUpdateTrimesters()

  const trimesters = settings.trimesters.length === 3
    ? settings.trimesters
    : DEFAULT_TRIMESTERS

  const form = useForm<TrimesterUpdate>({
    resolver: zodResolver(TrimesterUpdateSchema),
    defaultValues: { trimesters },
  })

  const { fields } = useFieldArray({
    control: form.control,
    name: "trimesters",
  })

  function onSubmit(data: TrimesterUpdate) {
    mutate(data)
  }

  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Configuration des trimestres</CardTitle>
            <p className="text-sm text-muted-foreground">Dates de début et fin de chaque trimestre</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="rounded-lg border p-4 space-y-3">
                <p className="text-sm font-semibold">{trimesters[index].label}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`trimesters.${index}.start_date`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>Date de début</FormLabel>
                        <FormControl>
                          <Input type="date" {...f} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`trimesters.${index}.end_date`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>Date de fin</FormLabel>
                        <FormControl>
                          <Input type="date" {...f} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isPending}>
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
