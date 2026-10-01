"use client"

import { useState } from "react"
import { ClipboardList, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Enrollment } from "@/lib/contracts/enrollment"
import {
  ARTISTIC_DISCIPLINES,
  LV2_OPTIONS,
  lv2AllowedForLevel,
  optionLabel,
  previousLevelLabel,
  profileOf,
  repeaterLabel,
} from "@/lib/contracts/enrollment-profile"
import { useClass } from "@/lib/hooks/useClasses"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { EnrollmentProfileDialog } from "./EnrollmentProfileDialog"

function Field({ label, value, emptyLabel = "Non renseigné" }: {
  label: string
  value: string
  emptyLabel?: string
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={value ? "text-sm font-medium" : "text-sm text-muted-foreground"}>
        {value || emptyLabel}
      </p>
    </div>
  )
}

/**
 * Les renseignements que la comptabilité reporte sur la fiche de la classe.
 *
 * Ce qui manque se dit « Non renseigné », jamais un faux « Non » : la fiche
 * sort vide à cet endroit, et l'école sait qu'il reste à compléter.
 */
export function EnrollmentProfileCard({ enrollment }: { enrollment: Enrollment }) {
  const [open, setOpen] = useState(false)
  const { has } = usePermissions()
  const { data: classe } = useClass(enrollment.class_id)
  const levelName = classe?.level_name ?? null
  const profile = profileOf(enrollment)
  const lv2Allowed = lv2AllowedForLevel(levelName)

  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ClipboardList className="h-4 w-4" aria-hidden />
            Renseignements de la fiche
          </h3>
          {has("enrollments:update") ? (
            <Button
              type="button"
              variant="outline"
              className="h-11 sm:h-10"
              onClick={() => setOpen(true)}
            >
              <Pencil className="mr-2 h-4 w-4" aria-hidden />
              Modifier
            </Button>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field
            label="Niveau antérieur"
            value={previousLevelLabel(profile.previous_level, profile.previous_series)}
          />
          <Field label="Qualité" value={repeaterLabel(profile.is_repeater)} />
          <Field
            label="LV2"
            value={optionLabel(LV2_OPTIONS, profile.lv2)}
            emptyLabel={lv2Allowed ? "Non renseigné" : "Non concerné (6ème, 5ème)"}
          />
          <Field
            label="Discipline artistique"
            value={optionLabel(ARTISTIC_DISCIPLINES, profile.artistic_discipline)}
          />
        </div>
      </CardContent>
      {open ? (
        <EnrollmentProfileDialog
          enrollmentId={enrollment.id}
          saved={profile}
          levelName={levelName}
          open={open}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </Card>
  )
}
