"use client"

import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarOff, Flag, Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
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
import { useAcademicYears } from "@/lib/hooks/useAcademicYears"

// Jours fériés civils fixes de Côte d'Ivoire (les fêtes religieuses mobiles —
// Aïd, Pâques, Ascension… — varient chaque année et restent en saisie manuelle).
const IVORIAN_CIVIL_HOLIDAYS: { month: number; day: number; label: string }[] = [
  { month: 1, day: 1, label: "Jour de l'An" },
  { month: 5, day: 1, label: "Fête du Travail" },
  { month: 8, day: 7, label: "Fête de l'Indépendance" },
  { month: 8, day: 15, label: "Assomption" },
  { month: 11, day: 1, label: "Toussaint" },
  { month: 11, day: 15, label: "Journée nationale de la Paix" },
  { month: 12, day: 25, label: "Noël" },
]

const pad = (n: number) => String(n).padStart(2, "0")

// Fériés civils tombant dans l'année scolaire [ayStart, ayEnd] (ISO yyyy-mm-dd).
// Les dates ISO se comparent lexicographiquement.
function civilHolidaysForYear(
  ayStart: string,
  ayEnd: string,
): { label: string; start_date: string; end_date: string }[] {
  const years = [...new Set([Number(ayStart.slice(0, 4)), Number(ayEnd.slice(0, 4))])]
  const rows: { label: string; start_date: string; end_date: string }[] = []
  for (const h of IVORIAN_CIVIL_HOLIDAYS) {
    for (const y of years) {
      const d = `${y}-${pad(h.month)}-${pad(h.day)}`
      if (d >= ayStart && d <= ayEnd) {
        rows.push({ label: h.label, start_date: d, end_date: d })
        break
      }
    }
  }
  return rows
}

interface HolidaySectionProps {
  settings: SchoolSettings
}

export function HolidaySection({ settings }: HolidaySectionProps) {
  const { mutate, isPending } = useUpdateHolidays()
  const { data: yearsData } = useAcademicYears()
  const currentYear =
    (yearsData?.items ?? []).find((y) => y.is_current) ?? (yearsData?.items ?? [])[0]

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

  function addCivilHolidays() {
    if (!currentYear) return
    const suggested = civilHolidaysForYear(currentYear.start_date, currentYear.end_date)
    const existing = new Set((form.getValues("holidays") ?? []).map((h) => h.start_date))
    const fresh = suggested.filter((h) => !existing.has(h.start_date))
    if (fresh.length === 0) {
      toast.info("Jours fériés civils déjà présents", {
        description: "Rien à ajouter pour l'année scolaire en cours.",
      })
      return
    }
    fresh.forEach((h) => append(h))
    toast.success(`${fresh.length} jour(s) férié(s) civil(s) ajouté(s)`, {
      description: "Relisez les dates puis enregistrez.",
    })
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
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 sm:h-10"
                  onClick={() => append({ label: "", start_date: "", end_date: "" })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un congé
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 sm:h-10"
                  onClick={addCivilHolidays}
                  disabled={!currentYear}
                  title="Ajoute les jours fériés civils fixes de l'année scolaire en cours."
                >
                  <Flag className="mr-2 h-4 w-4" />
                  Ajouter les jours fériés civils
                </Button>
              </div>
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
