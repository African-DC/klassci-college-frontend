"use client"

import { useFormContext } from "react-hook-form"
import type { WizardData } from "./WizardSteps"

function Row({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="grid grid-cols-3 gap-3 border-b py-2 last:border-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-sm font-medium">{value || <span className="text-muted-foreground italic">non renseigné</span>}</dd>
    </div>
  )
}

export function StepReview() {
  const { getValues } = useFormContext<WizardData>()
  const v = getValues()

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-muted/30 p-4">
        <p className="text-sm font-medium">Récapitulatif</p>
        <dl className="mt-3">
          <Row label="Slug" value={v.tenant_slug} />
          <Row label="URL" value={`https://${v.tenant_slug}.college.klassci.com`} />
          <Row label="Nom" value={v.school_name} />
          <Row label="Admin email" value={v.admin_email} />
          <Row label="Adresse" value={v.school_address} />
          <Row label="Téléphone" value={v.school_phone} />
          <Row label="Email école" value={v.school_email} />
          <Row label="Code ministère" value={v.ministry_code} />
        </dl>
      </div>

      <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
        ⚠ Le provisioning prend 10-30 secondes. Une base MySQL sera créée, les migrations
        appliquées, et un email de bienvenue envoyé à l'admin (si SMTP configuré).
      </div>
    </div>
  )
}
