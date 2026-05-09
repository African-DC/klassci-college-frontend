"use client"

import { useFormContext } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { WizardData } from "./WizardSteps"

export function StepAdmin() {
  const { register, formState } = useFormContext<WizardData>()

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="admin_email">Email administrateur *</Label>
        <Input
          id="admin_email"
          type="email"
          placeholder="admin@lycee-moderne.ci"
          autoComplete="email"
          {...register("admin_email")}
        />
        {formState.errors.admin_email && (
          <p className="text-xs text-destructive">{formState.errors.admin_email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="admin_password">Mot de passe initial *</Label>
        <Input
          id="admin_password"
          type="password"
          placeholder="8 caractères minimum"
          autoComplete="new-password"
          {...register("admin_password")}
        />
        {formState.errors.admin_password ? (
          <p className="text-xs text-destructive">{formState.errors.admin_password.message}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            L'admin pourra changer son mot de passe dès la 1re connexion.
          </p>
        )}
      </div>
    </div>
  )
}
