"use client"

import { useFormContext } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { WizardData } from "./WizardSteps"

export function StepOptional() {
  const { register, formState } = useFormContext<WizardData>()

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Ces champs sont optionnels — ils peuvent être renseignés plus tard depuis les paramètres de
        l'établissement.
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="school_address">Adresse</Label>
        <Input
          id="school_address"
          placeholder="Cocody, Abidjan"
          {...register("school_address")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="school_phone">Téléphone</Label>
          <Input id="school_phone" placeholder="+225 01 23 45 67" {...register("school_phone")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="school_email">Email établissement</Label>
          <Input
            id="school_email"
            type="email"
            placeholder="contact@lycee-moderne.ci"
            {...register("school_email")}
          />
          {formState.errors.school_email && (
            <p className="text-xs text-destructive">{formState.errors.school_email.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ministry_code">Code ministère</Label>
        <Input id="ministry_code" placeholder="DREN-ABJ-042" {...register("ministry_code")} />
      </div>
    </div>
  )
}
