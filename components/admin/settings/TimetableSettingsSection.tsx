"use client"

import { useState } from "react"
import { Clock3, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  TimetableSettingsUpdateSchema,
  type SchoolSettings,
  type TimetableSettingsUpdate,
} from "@/lib/contracts/settings"
import { useUpdateTimetableSettings } from "@/lib/hooks/useSettings"

const FIELDS: { key: keyof TimetableSettingsUpdate; label: string; hint: string }[] = [
  { key: "day_start_hour", label: "Début de la journée", hint: "Heure au format 24 h" },
  { key: "day_end_hour", label: "Fin de la journée", hint: "Dernière heure de la grille" },
  { key: "slot_duration_minutes", label: "Durée d’un créneau", hint: "En minutes, pour la génération" },
]

export function TimetableSettingsSection({ settings, canEdit }: { settings: SchoolSettings; canEdit: boolean }) {
  const [values, setValues] = useState<TimetableSettingsUpdate>({
    day_start_hour: settings.day_start_hour,
    day_end_hour: settings.day_end_hour,
    slot_duration_minutes: settings.slot_duration_minutes,
  })
  const [error, setError] = useState<string | null>(null)
  const update = useUpdateTimetableSettings()

  function save() {
    const parsed = TimetableSettingsUpdateSchema.safeParse(values)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Horaires invalides.")
      return
    }
    setError(null)
    update.mutate(parsed.data)
  }

  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock3 className="size-5 text-primary" aria-hidden />
          Horaires de l’emploi du temps
        </CardTitle>
        <CardDescription>
          Configurez la plage scolaire utilisée par la grille, le PDF et la génération.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          {FIELDS.map(({ key, label, hint }) => (
            <div className="space-y-2" key={key}>
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                type="number"
                inputMode="numeric"
                step={1}
                className="h-11 tabular-nums"
                value={Number.isNaN(values[key]) ? "" : values[key]}
                disabled={!canEdit || update.isPending}
                onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.valueAsNumber }))}
              />
              <p className="text-xs text-muted-foreground">{hint}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Les cours existants restent enregistrés même s’ils sont en dehors des nouveaux horaires.
        </p>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {canEdit ? (
          <div className="flex justify-end">
            <Button type="button" disabled={update.isPending} onClick={save}>
              <Save className="mr-2 size-4" aria-hidden />
              {update.isPending ? "Enregistrement…" : "Enregistrer les horaires"}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Lecture seule : autorisation de modification requise.</p>
        )}
      </CardContent>
    </Card>
  )
}
